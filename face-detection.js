module.exports = function (RED) {
  function yolov8NodeFace(config) {
    RED.nodes.createNode(this, config);
    const ort = require("onnxruntime-node");
    const sharp = require("sharp");
    const fs = require("fs");

    const node = this;
    const returnValue = Number(config.returnValue);
    const saveDir = config.absolutePathDir;

    let model;
    let processing = false;
    let messageQueue = [];

    node.on("input", async function (msg) {
      messageQueue.push(msg);
      if (!processing) {
        processQueue();
      }
    });

    async function processQueue() {
      if (messageQueue.length === 0) {
        processing = false;
        return;
      }

      processing = true;
      const msg = messageQueue.shift();

      node.status({ fill: "blue", shape: "dot", text: "processing..." });

      try {
        // Override threshold and model if provided in msg.faceOptions
        let threshold = msg.faceOptions && !isNaN(msg.faceOptions.threshold) && msg.faceOptions.threshold >= 0.1 && msg.faceOptions.threshold <= 1 && msg.faceOptions.threshold !== ""
          ? msg.faceOptions.threshold
          : config.threshold;

        const modelName = msg.faceOptions && typeof msg.faceOptions.model === 'string' && (msg.faceOptions.model === 'yolov8n-face' || msg.faceOptions.model === 'yolov8s-face')
          ? msg.faceOptions.model
          : config.model;

        if (model === undefined || modelName !== config.model) {
          model = await ort.InferenceSession.create(`${__dirname}/model/${modelName}.onnx`);
        }

        if (returnValue === 2 && fs.existsSync(saveDir) === false) {
          node.status({
            fill: "red",
            shape: "ring",
            text: "folder doesn't exist",
          });
          node.error("folder doesn't exist");
          processQueue();
          return;
        }

        const bufferFromImage = msg.payload;
        const img = sharp(bufferFromImage);
        const boxes = await detectFacesOnImage(img, threshold);
        msg.payload = boxes.length;
        msg.originImg = bufferFromImage;

        if (returnValue === 0) {
          msg.data = getDetectedFaces(boxes);
        } else if (returnValue === 1) {
          msg.data = await getImageBuffers(boxes, bufferFromImage);
        } else if (returnValue === 2) {
          msg.data = await saveImages(boxes, bufferFromImage);
        }

        msg.faceConfig = {
          threshold: Number(threshold),
          model: modelName
        };

        node.send(msg);

        if (msg.payload >= 1) {
          node.status({ fill: "green", shape: "ring", text: `${msg.payload} face(s)` });
        } else {
          node.status({ fill: "red", shape: "ring", text: "No faces" });
        }
      } catch (error) {
        node.status({ fill: "red", shape: "ring", text: error.message });
        node.error(error);
      }

      processQueue();
    }

    async function detectFacesOnImage(img, threshold) {
      const [input, imgWidth, imgHeight] = await prepareInput(img);
      const output = await runModel(input);
      return processOutput(output, imgWidth, imgHeight, threshold);
    }

    async function prepareInput(img) {
      const md = await img.metadata();
      const [imgWidth, imgHeight] = [md.width, md.height];
      const pixels = await img
        .removeAlpha()
        .resize({ width: 640, height: 640, fit: "fill" })
        .raw()
        .toBuffer();

      const red = [];
      const green = [];
      const blue = [];

      for (let index = 0; index < pixels.length; index += 3) {
        red.push(pixels[index] / 255.0);
        green.push(pixels[index + 1] / 255.0);
        blue.push(pixels[index + 2] / 255.0);
      }
      const input = [...red, ...green, ...blue];
      return [input, imgWidth, imgHeight];
    }

    async function runModel(input) {
      input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
      const outputs = await model.run({ images: input });
      return outputs["output0"].data;
    }

    function processOutput(output, imgWidth, imgHeight, threshold) {
      let boxes = [];
      for (let index = 0; index < 8400; index++) {
        const prob = output[8400 * 4 + index];
        if (prob < threshold) {
          continue;
        }
        const label = "face";
        const xc = output[index];
        const yc = output[8400 + index];
        const w = output[2 * 8400 + index];
        const h = output[3 * 8400 + index];

        const x1 = Math.max(((xc - w / 2) / 640) * imgWidth, 0);
        const y1 = Math.max(((yc - h / 2) / 640) * imgHeight, 0);
        const x2 = Math.min(((xc + w / 2) / 640) * imgWidth, imgWidth);
        const y2 = Math.min(((yc + h / 2) / 640) * imgHeight, imgHeight);
        boxes.push([x1, y1, x2, y2, label, prob]);
      }

      boxes = boxes.sort((box1, box2) => box2[5] - box1[5]);
      let result = [];
      while (boxes.length > 0) {
        result.push(boxes[0]);
        boxes = boxes.filter((box) => iou(boxes[0], box) < 0.7);
      }
      return result;
    }

    function getDetectedFaces(boxes) {
      const result = { boxes: [] };
      boxes.forEach((box) => {
        const info = {
          x: box[0],
          y: box[1],
          w: box[2] - box[0],
          h: box[3] - box[1],
          prob: box[5],
        };

        result["boxes"].push(info);
      });
      return result;
    }

    async function getImageBuffers(boxes, bufferFromImage) {
      const result = { face: [], boxes: [] };
      await Promise.all(
        boxes.map(async (box) => {
          try {
            const buffer = await makeBuffer(box, bufferFromImage);
            result["face"].push(buffer);
            const info = {
              x: box[0],
              y: box[1],
              w: box[2] - box[0],
              h: box[3] - box[1],
              prob: box[5],
            };
            result["boxes"].push(info);
          } catch (error) {
            node.error("An error occurred, when image cropped");
          }
        })
      );
      return result;
    }

    async function saveImages(boxes, bufferFromImage) {
      let faceCount = 1;
      const today = new Date();
      const dateformat =
        today.getFullYear() +
        (today.getMonth() + 1 < 10
          ? "0" + (today.getMonth() + 1)
          : today.getMonth() + 1) +
        (today.getDate() < 10 ? "0" + today.getDate() : today.getDate()) +
        (today.getHours() < 10 ? "0" + today.getHours() : today.getHours()) +
        (today.getMinutes() < 10
          ? "0" + today.getMinutes()
          : today.getMinutes()) +
        (today.getSeconds() < 10
          ? "0" + today.getSeconds()
          : today.getSeconds());

      const result = { face: [] };
      await Promise.all(
        boxes.map(async (box) => {
          const imageName = dateformat + "_" + "face" + faceCount++ + ".png";
          const outputImage = saveDir + "/" + imageName;
          await sharp(bufferFromImage)
            .extract({
              width: parseInt(box[2] - box[0]),
              height: parseInt(box[3] - box[1]),
              left: parseInt(box[0]),
              top: parseInt(box[1]),
            })
            .toFile(outputImage)
            .then(() => result["face"].push(imageName))
            .catch(() =>
              node.error("An error occurred, when image cropped and saved")
            );
        })
      );

      for (let key in result) {
        result[key].sort((name1, name2) => {
          return name1.length - name2.length || name1.localeCompare(name2);
        });
      }
      return result;
    }

    async function makeBuffer(box, bufferFromImage) {
      const buffer = await sharp(bufferFromImage)
        .extract({
          width: parseInt(box[2] - box[0]),
          height: parseInt(box[3] - box[1]),
          left: parseInt(box[0]),
          top: parseInt(box[1]),
        })
        .toFormat("png")
        .toBuffer();

      return buffer;
    }

    function iou(box1, box2) {
      return intersection(box1, box2) / union(box1, box2);
    }

    function union(box1, box2) {
      const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
      const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
      const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1);
      const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1);
      return box1_area + box2_area - intersection(box1, box2);
    }

    function intersection(box1, box2) {
      const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
      const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
      const x1 = Math.max(box1_x1, box2_x1);
      const y1 = Math.max(box1_y1, box2_y1);
      const x2 = Math.min(box1_x2, box2_x2);
      const y2 = Math.min(box1_y2, box2_y2);
      return (x2 - x1) * (y2 - y1);
    }
  }

  RED.nodes.registerType("face-detection-plus", yolov8NodeFace);
};