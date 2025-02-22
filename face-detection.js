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

        if (!model || modelName !== config.model) {
          model = await ort.InferenceSession.create(`${__dirname}/model/${modelName}.onnx`);
        }

        if (returnValue === 2 && !fs.existsSync(saveDir)) {
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
        const boxes = await detectFacesOnImage(img, threshold, model, ort);
        msg.payload = boxes.length;
        msg.originImg = bufferFromImage;

        if (returnValue === 0) {
          msg.data = getDetectedFaces(boxes);
        } else if (returnValue === 1) {
          msg.data = await getImageBuffers(boxes, bufferFromImage, node, sharp);
        } else if (returnValue === 2) {
          msg.data = await saveImages(boxes, bufferFromImage, saveDir, node, sharp);
        }

        msg.faceConfig = {
          threshold: Number(threshold),
          model: modelName
        };

        node.send(msg);

        node.status({ fill: msg.payload >= 1 ? "green" : "red", shape: "ring", text: `${msg.payload} face(s)` });
      } catch (error) {
        node.status({ fill: "red", shape: "ring", text: error.message });
        node.error(error);
      }

      processQueue();
    }
  }

  RED.nodes.registerType("face-detection-plus", yolov8NodeFace);
};

async function detectFacesOnImage(img, threshold, model, ort) {
  const [input, imgWidth, imgHeight] = await prepareInput(img);
  const output = await runModel(input, model, ort);
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

  const input = new Float32Array(3 * 640 * 640);
  for (let i = 0; i < pixels.length; i += 3) {
    input[i / 3] = pixels[i] / 255.0;
    input[i / 3 + 640 * 640] = pixels[i + 1] / 255.0;
    input[i / 3 + 2 * 640 * 640] = pixels[i + 2] / 255.0;
  }
  return [input, imgWidth, imgHeight];
}

async function runModel(input, model, ort) {
  input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
  const outputs = await model.run({ images: input });
  return outputs["output0"].data;
}

function processOutput(output, imgWidth, imgHeight, threshold) {
  let boxes = [];
  for (let i = 0; i < 8400; i++) {
    const prob = output[8400 * 4 + i];
    if (prob < threshold) continue;

    const xc = output[i];
    const yc = output[8400 + i];
    const w = output[2 * 8400 + i];
    const h = output[3 * 8400 + i];

    const x1 = Math.max(((xc - w / 2) / 640) * imgWidth, 0);
    const y1 = Math.max(((yc - h / 2) / 640) * imgHeight, 0);
    const x2 = Math.min(((xc + w / 2) / 640) * imgWidth, imgWidth);
    const y2 = Math.min(((yc + h / 2) / 640) * imgHeight, imgHeight);
    boxes.push([x1, y1, x2, y2, "face", prob]);
  }

  boxes.sort((a, b) => b[5] - a[5]);
  return boxes.filter((box, i, arr) => arr.slice(0, i).every(b => iou(box, b) < 0.7));
}

function getDetectedFaces(boxes) {
  return { boxes: boxes.map(box => ({ x: box[0], y: box[1], w: box[2] - box[0], h: box[3] - box[1], prob: box[5] })) };
}

async function getImageBuffers(boxes, bufferFromImage, node, sharp) {
  const result = { face: [], boxes: [] };
  await Promise.all(boxes.map(async box => {
    try {
      const buffer = await makeBuffer(box, bufferFromImage, node, sharp);
      result.face.push(buffer);
      result.boxes.push({ x: box[0], y: box[1], w: box[2] - box[0], h: box[3] - box[1], prob: box[5] });
    } catch (error) {
      node.error(`An error occurred when cropping image: ${error.message}`);
    }
  }));
  return result;
}

async function saveImages(boxes, bufferFromImage, saveDir, node, sharp) {
  let faceCount = 1;
  const today = new Date();
  const dateformat = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}${String(today.getSeconds()).padStart(2, '0')}`;

  const result = { face: [] };
  await Promise.all(boxes.map(async box => {
    const imageName = `${dateformat}_face${faceCount++}.png`;
    const outputImage = `${saveDir}/${imageName}`;
    await sharp(bufferFromImage)
      .extract({ width: parseInt(box[2] - box[0]), height: parseInt(box[3] - box[1]), left: parseInt(box[0]), top: parseInt(box[1]) })
      .toFile(outputImage)
      .then(() => result.face.push(imageName))
      .catch(error => node.error(`An error occurred when cropping and saving image: ${error.message}`));
  }));

  result.face.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return result;
}

async function makeBuffer(box, bufferFromImage, node, sharp) {
  try {
    return await sharp(bufferFromImage)
      .extract({ width: parseInt(box[2] - box[0]), height: parseInt(box[3] - box[1]), left: parseInt(box[0]), top: parseInt(box[1]) })
      .toFormat("png")
      .toBuffer();
  } catch (error) {
    node.error(`An error occurred when making buffer: ${error.message}`);
    throw error;
  }
}

function iou(box1, box2) {
  return intersection(box1, box2) / union(box1, box2);
}

function union(box1, box2) {
  const [x1, y1, x2, y2] = box1;
  const [x3, y3, x4, y4] = box2;
  const area1 = (x2 - x1) * (y2 - y1);
  const area2 = (x4 - x3) * (y4 - y3);
  return area1 + area2 - intersection(box1, box2);
}

function intersection(box1, box2) {
  const [x1, y1, x2, y2] = box1;
  const [x3, y3, x4, y4] = box2;
  const xi1 = Math.max(x1, x3);
  const yi1 = Math.max(y1, y3);
  const xi2 = Math.min(x2, x4);
  const yi2 = Math.min(y2, y4);
  return Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
}