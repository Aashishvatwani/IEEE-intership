import { spawn } from "child_process";

export const runOCR = (filePath) => {
  return new Promise((resolve, reject) => {
    // Use the virtual environment Python
    const pythonPath = "F:/IEEE-INTERNSHIP/.venv/Scripts/python.exe";
    const python = spawn(pythonPath, ["-Xutf8", "ocr.py", filePath]);
    let dataBuffer = "";
    let errorBuffer = "";

    python.stdout.on("data", (data) => (dataBuffer += data.toString()));
    python.stderr.on("data", (data) => (errorBuffer += data.toString()));

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("Python OCR Error:", errorBuffer);
        return reject(new Error(`OCR failed with code ${code}: ${errorBuffer}`));
      }
      try {
        const parsed = JSON.parse(dataBuffer);
        resolve(parsed);
      } catch (err) {
        console.error("JSON Parse Error:", dataBuffer);
        reject(new Error("Failed to parse OCR output: " + err.message));
      }
    });

    python.on("error", (err) => {
      console.error("Python Process Error:", err);
      reject(new Error("Failed to start Python process: " + err.message));
    });
  });
};
