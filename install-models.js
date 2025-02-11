const axios = require("axios");
const fs = require("fs");
const path = require("path");

const modelUrls = {
  "yolov8n-face": "https://github.com/smcgann99/node-red-face-detection-plus/raw/main/model/yolov8n-face.onnx",
  "yolov8s-face": "https://github.com/smcgann99/node-red-face-detection-plus/raw/main/model/yolov8s-face.onnx"
};

const downloadDir = path.join(__dirname, "model");

async function downloadModels() {
  try {
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    for (const modelName in modelUrls) {
      const modelPath = path.join(downloadDir, `${modelName}.onnx`);
      
      // Skip if model already exists
      if (fs.existsSync(modelPath)) {
        console.log(`Model ${modelName}.onnx already exists, skipping download`);
        continue;
      }

      const modelUrl = modelUrls[modelName];
      console.log(`Downloading ${modelName}.onnx...`);
      
      const response = await axios.get(modelUrl, { 
        responseType: "stream",
       // timeout: 60000 // 60 second timeout for large files
      });

      const fileStream = fs.createWriteStream(modelPath);
      response.data.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", (error) => {
          // Clean up partial file on error
          fs.unlinkSync(modelPath);
          reject(error);
        });
      });

      console.log(`Model file ${modelName}.onnx download complete`);
    }
  } catch (error) {
    console.error("Error downloading model file:", error.message);
    throw error; // Re-throw to handle at higher level if needed
  }
}

// Export for use in other files
module.exports = downloadModels;

// Run if called directly
if (require.main === module) {
  downloadModels().catch(console.error);
}