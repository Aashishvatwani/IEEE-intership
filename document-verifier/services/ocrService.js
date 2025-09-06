import { spawn } from "child_process";

export const runOCR = (filePath) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["-Xutf8", "ocr.py", filePath]);
    let dataBuffer = "";
    let errorBuffer = "";

    python.stdout.on("data", (data) => (dataBuffer += data.toString()));
    python.stderr.on("data", (data) => (errorBuffer += data.toString()));

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(errorBuffer);
      }
      try {
        const parsed = JSON.parse(dataBuffer);
        resolve(parsed);
      } catch (err) {
        reject("Failed to parse OCR output: " + err.message);
      }
    });
  });
};
