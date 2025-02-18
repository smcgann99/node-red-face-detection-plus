[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![npm version](https://badge.fury.io/js/@smcgann%2Fnode-red-face-detection-plus.svg)](https://badge.fury.io/js/@smcgann%2Fnode-red-detection-plus)
[![Min Node Version](https://img.shields.io/node/v/smcgann/node-red-face-detection-plus)](https://www.npmjs.com/package/%40smcgann%2Fnode-red-annotate-image-plus)
[![GitHub license](https://img.shields.io/github/license/smcgann99/node-red-face-detection-plus)](https://github.com/smcgann99/node-red-face-detection-plus/blob/main/LICENSE)

# @smcgann/node-red-face-detection-plus

A <a href="http://nodered.org" target="_blank">Node-RED</a> node that detects faces using AI.

You can use the output with node-red-vectorize-plus as part of a face recognition flow. You can also use it to crop the face images from the original image and save them as files.

This node is based on [![@GOOD-I-DEER/node-red-contrib-face-detection](https://www.npmjs.com/package/@good-i-deer/node-red-contrib-face-detection)

# Key changes 
- Added YoloV8s-face model.
- Image Buffer output now also includes bounding boxes, as these my be needed for annotations etc.
- Moved data and originImg into separate msg. properties.
- Return number of found faces in msg.payload.
- Configuration can be overridden by msg.faceOptions.
- Used configuration is reported in msg.faceConfig.
- These changes make it easier to integrate the node within a flow.

# Install

Either use the Edit Menu - Manage Palette option to install, or run the following command in your Node-RED user directory - typically `~/.node-red`

```bash
cd ~/.node-red/
npm install @smcgann/node-red-face-detection-plus
```

### Input

- msg.payload
  Image Buffer (PNG,JPG,GIF,WEBP,TIFF,AVIF Image represented as binary buffer)

- msg.faceOptions
  Object (Optional input - used to override node config settings e.g. {"threshold":0.4,"model":"yolov8n-face"} )


### Property

<img width="700" alt="Properties" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/config.png">

Name

- The name of the node displayed in the editor.

Model

- The model to use for detection yoloV8n or yoloV8s (the **s** model is better at detecting smaller faces, at the expense of longer processing time)

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
  <img width="300" style="display : inline-block; margin-left: 10px;" alt="detected_object" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_objects.png">
</details>
    
<details>
  <summary>Image Buffer</summary>
  <img width="300" alt="image_buffer" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_array.png">
</details>

<details>
  <summary>Image File</summary>
  <img width="300" alt="image_file" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_images.png">
</details>
    
msg.faceConfig -> Object (returns values used for detection)
e.g. {"threshold":0.4,"model":"yolov8n-face"}

mag.payload -> Number (number of faces detected)


## **Authors**
**[S.McGann](https://github.com/smcgann99)** Modified Version
**[GOOD-I-DEER](https://github.com/GOOD-I-DEER)** in SSAFY(Samsung Software Academy for Youth) 9th

- [Kim Jaea](https://github.com/kimjaea)
- [Yi Jong Min](https://github.com/chickennight)
- [Lee Deok Yong](https://github.com/Gitgloo)
- [Lee Che Lim](https://github.com/leecr1215)
- [Lee Hyo Sik](https://github.com/hy06ix)
- [Jung Gyu Sung](https://github.com/ramaking)

## **Copyright and license**

S.McGann - Modified Version
Samsung Automation Studio Team under the **[GNU General Public License v3.0 license](https://www.gnu.org/licenses/gpl-3.0.html)**.

## **Reference**

- [Node-RED Creating Nodes](https://nodered.org/docs/creating-nodes/)
- [SamsungAutomationStudio Github Repository](https://github.com/Samsung/SamsungAutomationStudio)
- [Ultralytics YOLOv8](https://docs.ultralytics.com/)
- [yolov8 onnx on javascript](https://github.com/AndreyGermanov/yolov8_onnx_javascript)
- [yolov8 onnx on nodejs](https://github.com/AndreyGermanov/yolov8_onnx_nodejs)
- [yolov8 face model](https://github.com/akanametov/yolov8-face/tree/dev#inference)