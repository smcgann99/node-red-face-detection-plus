# @smcgann/node-red-face-detection-plus

[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![GitHub license](https://img.shields.io/github/license/smcgann99/node-red-face-detection-plus)](https://github.com/smcgann99/node-red-face-detection-plus/blob/main/LICENSE)

This node is based on  provides a node that detects faces using AI in Node-RED.

These nodes require node.js version >=18 and Node-RED version >=3.1.0.

<hr>

# Description

 This module provides a node that detects faces in the picture. You can use the output with node-red-vectorize-plus as part of a face recognition flow.
 You can also use it to crop the face images from the original image and save them as files.

# Install

Either use the Edit Menu - Manage Palette option to install, or run the following command in your Node-RED user directory - typically `~/.node-red`

```bash
cd ~/.node-red/
npm install @smcgann/node-red-face-detection-plus
```

### Input

- msg.payload -> Image Buffer (Image represented as binary buffer)
- msg.faceOptions -> Object (used to override node config settings)
e.g. {"threshold":0.4,"model":"yolov8n-face"}


### Property

<img width="700" alt="detected_object" src="https://github.com/smcgann99/node-red-face-detection-plus/assets/130892737/4b813dbf-d39b-4a84-b731-1f9f82500d2e">

Name

- The name of the node displayed in the editor.

Return Value

- Type of data to be returned by the output of the node. Supports Detected Object, Image Buffer, and Image File.
    - Detected Object : **data.boxes** will contain the detected face objects. Included values are x, y, w, h, prob.
        - x : zero-indexed offset from left edge of the original image
        - y : zero-indexed offset from top edge of the original image
        - w : the width of cropped image
        - h : the height of cropped image
        - prob : Accuracy of the face detected by the model
    - Image Buffer : **data.faces** will contain an array of image buffers cropped from input image. Also includes **data.boxes** as above.
    - Image File : Image file(s) of the cropped faces.

Absolute Path Dir

- Absolute path to save the file to. Shown only when you select Image File as Return Value

Confidence Threshold

- Confidence threshold of the results of the pre-trained model. You must specify a value between 0.1 and 1. The lower the value, the more faces are detected.

### Output

Data is output in the output format selected in the 'Return Value' property.

<details>
  <summary>Detected Object</summary>
  <img width="180" style="display : inline-block; margin-left: 10px;" alt="detected_object" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_objects.png">
</details>
    
<details>
  <summary>Image Buffer</summary>
  <img width="700" alt="image_buffer" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_array.png">
</details>

<details>
  <summary>Image File</summary>
  <img width="700" alt="image_file" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_images.png">
</details>
    
msg.faceConfig -> Object (returns values used for detection)
e.g. {"threshold":0.4,"model":"yolov8n-face"}

mag.payload -> Number (number of faces detected)

### Examples

This is a simple example of this node.

<img width="700" alt="example_flow" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/file.png">

### JSON

```json
[
    {
        "id": "bf67e15413744e7a",
        "type": "debug",
        "z": "83078a0b9760cbee",
        "name": "Result",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 910,
        "y": 340,
        "wires": []
    },
    {
        "id": "8619fc0fa7da3fe8",
        "type": "good-face-detection",
        "z": "83078a0b9760cbee",
        "name": "",
        "returnValue": "2",
        "threshold": 0.5,
        "absolutePathDir": "C:\\Users\\SSAFY\\Desktop\\test",
        "x": 720,
        "y": 340,
        "wires": [
            [
                "bf67e15413744e7a"
            ]
        ]
    },
    {
        "id": "0f11aafbbf09699e",
        "type": "file in",
        "z": "83078a0b9760cbee",
        "name": "Image Path",
        "filename": "C:\\Users\\SSAFY\\Desktop\\ssdc\\object\\플로우만들기\\test.png",
        "filenameType": "str",
        "format": "",
        "chunk": false,
        "sendError": false,
        "encoding": "none",
        "allProps": false,
        "x": 510,
        "y": 340,
        "wires": [
            [
                "8619fc0fa7da3fe8"
            ]
        ]
    },
    {
        "id": "b9dc304adfa64f1c",
        "type": "inject",
        "z": "83078a0b9760cbee",
        "name": "Inject",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": "3",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 350,
        "y": 340,
        "wires": [
            [
                "0f11aafbbf09699e"
            ]
        ]
    }
]
```

## **Discussions and suggestions**

Use **[GitHub Issues](https://github.com/GOOD-I-DEER/node-red-contrib-face-vectorization/issues)** to ask questions or to discuss new features.

## **Authors**

**[GOOD-I-DEER](https://github.com/GOOD-I-DEER)** in SSAFY(Samsung Software Academy for Youth) 9th

- [Kim Jaea](https://github.com/kimjaea)
- [Yi Jong Min](https://github.com/chickennight)
- [Lee Deok Yong](https://github.com/Gitgloo)
- [Lee Che Lim](https://github.com/leecr1215)
- [Lee Hyo Sik](https://github.com/hy06ix)
- [Jung Gyu Sung](https://github.com/ramaking)

## **Copyright and license**

Copyright Samsung Automation Studio Team under the **[GNU General Public License v3.0 license](https://www.gnu.org/licenses/gpl-3.0.html)**.

## **Reference**

- [Node-RED Creating Nodes](https://nodered.org/docs/creating-nodes/)
- [SamsungAutomationStudio Github Repository](https://github.com/Samsung/SamsungAutomationStudio)
- [Ultralytics YOLOv8](https://docs.ultralytics.com/)
- [yolov8 onnx on javascript](https://github.com/AndreyGermanov/yolov8_onnx_javascript)
- [yolov8 onnx on nodejs](https://github.com/AndreyGermanov/yolov8_onnx_nodejs)
- [yolov8 face model](https://github.com/akanametov/yolov8-face/tree/dev#inference)