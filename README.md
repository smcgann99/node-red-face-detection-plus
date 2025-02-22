[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![npm version](https://img.shields.io/npm/v/@smcgann/node-red-face-detection-plus.svg)](https://www.npmjs.com/package/@smcgann/node-red-face-detection-plus)
[![Min Node Version](https://img.shields.io/node/v/@smcgann/node-red-face-detection-plus)](https://www.npmjs.com/package/@smcgann/node-red-annotate-image-plus)
[![GitHub license](https://img.shields.io/github/license/smcgann99/node-red-face-detection-plus)](https://github.com/smcgann99/node-red-face-detection-plus/blob/main/LICENSE)



# **@smcgann/node-red-face-detection-plus**

A <a href="http://nodered.org" target="_blank">Node-RED</a> node that detects faces using AI.

You can use the output with 🔗 [@smcgann/node-red-vectorize-plus](https://www.npmjs.com/package/@smcgann/node-red-vectorize-plus) as part of a face recognition flow. You can also use it to crop the face images from the original image and save them as files.

This node is derived from 🔗 [@GOOD-I-DEER/node-red-contrib-face-detection](https://www.npmjs.com/package/@good-i-deer/node-red-contrib-face-detection)

## **Key Changes**
✔ Added **YOLOv8s-face** model.  
✔ Added **postinstall** script to download models.   
✔ Image Buffer output now includes **bounding boxes** (useful for annotations).  
✔ Moved **data** and **originImg** into separate `msg` properties.  
✔ Returns **number of detected faces** in `msg.payload`.  
✔ Supports runtime configuration through `msg.faceOptions` for dynamic settings.  
✔ Includes metadata in `msg.faceConfig` (threshold and model).  
✔ More robust **error handling**.  
✔ **Better Performance**.  
✔ **Easier integration** into Node-RED flows.

---

## **Installation**

Either use the Edit Menu - Manage Palette option to install, or run the following command in your Node-RED user directory - typically `~/.node-red`

```bash
cd ~/.node-red/
npm install @smcgann/node-red-face-detection-plus
```

---

## **Input Properties**  
### 🖼️ **msg.payload** → `Image Buffer`  
- Accepts **PNG, JPG, GIF, WEBP, TIFF, AVIF** (binary image data).  

### ⚙️ **msg.faceOptions** → `Object` *(Optional)*  
- Allows overriding node config settings dynamically.  
- Example:  
``` json
{  
  "threshold": 0.4,  
  "model": "yolov8n-face"  
}  
```
---

## **Node Properties**  
<img width="500" alt="Properties" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/config.png">

### 🏷 **Name**  
- The name displayed in the Node-RED editor.  

### 🔍 **Model**  
Select the detection model:  
  - **YOLOv8n** (faster, good for larger faces)  
  - **YOLOv8s** (detects smaller faces, but slower)  

### 📤 **Return Value**  
Defines the type of data returned:  
- **Detected Object** → `data.boxes`  
- **Image Buffer** → `data.faces` (array of cropped face images) +  `data.boxes` 
- **Image File** → Saves detected faces as separate files.  

### 📂 **Absolute Path Dir**  
(Visible if **Image File** is selected)  
- Defines where the cropped face images are saved.  

### 🎯 **Confidence Threshold**  
- Defines the **minimum score** required for a detected face to be considered valid (**range: 0.1 - 1**):  

  | Threshold | Effect |  
  |-----------|--------|  
  | **Low (0.1 - 0.4)** | More faces detected, but higher risk of false positives. |  
  | **High (0.7 - 1.0)** | Fewer faces detected, reducing false positives but possibly missing faces. |  

---

## Output

Data is output in the output format selected in the 'Return Value' property.

### 📌 **msg.payload** → `Number`  
- Number of faces detected.  
### 🖼️ **msg.originImg** → `Buffer`  
- Input Image.  
<details>
  <summary>Detected Object</summary>
  <img width="300" style="display: inline-block; margin-left: 10px;" alt="detected_object" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_objects.png">
</details>

<details>
  <summary>Image Buffer</summary>
  <img width="300" alt="image_buffer" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_array.png">
</details>

<details>
  <summary>Image File</summary>
  <img width="300" alt="image_file" src="https://raw.githubusercontent.com/smcgann99/node-red-face-detection-plus/main/assets/facedetect_images.png">
</details>

### ⚙️ **msg.faceConfig** → `Object`  
- Returns values used for detection.  
 
```json
  {  
    "threshold": 0.4,  
    "model": "yolov8n-face"  
  }  
```


---
## **Authors**  

👤 **[S.McGann](https://github.com/smcgann99)** → Modified Version.  

👥 **[GOOD-I-DEER](https://github.com/GOOD-I-DEER)** (Samsung Software Academy for Youth)  
- [Kim Jaea](https://github.com/kimjaea)  
- [Yi Jong Min](https://github.com/chickennight)  
- [Lee Deok Yong](https://github.com/Gitgloo)  
- [Lee Che Lim](https://github.com/leecr1215)  
- [Lee Hyo Sik](https://github.com/hy06ix)  
- [Jung Gyu Sung](https://github.com/ramaking)  

---

## **Copyright and license**

📜S.McGann → Modified Version

📜Samsung Automation Studio Team under the **[GNU General Public License v3.0 license](https://www.gnu.org/licenses/gpl-3.0.html)**.


## **References**  
🔗 [Node-RED Creating Nodes](https://nodered.org/docs/creating-nodes/)  
🔗 [Samsung Automation Studio Github Repository](https://github.com/Samsung/SamsungAutomationStudio)  
🔗 [Ultralytics YOLOv8](https://docs.ultralytics.com/)  
🔗 [YOLOv8 ONNX in JavaScript](https://github.com/AndreyGermanov/yolov8_onnx_javascript)  
🔗 [YOLOv8 ONNX in Node.js](https://github.com/AndreyGermanov/yolov8_onnx_nodejs)  
🔗 [YOLOv8 Face Model](https://github.com/akanametov/yolov8-face/tree/dev#inference)  