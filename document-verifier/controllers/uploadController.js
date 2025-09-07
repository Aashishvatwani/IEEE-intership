import fs from 'fs';
import { runOCR } from "../services/ocrService.js";
import { verifyAadhaar } from "../services/aadhaarService.js";
import { verifyPAN } from "../services/panService.js";

export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const filePath = req.file.path; // temporary path

  try {
    // Step 1: OCR
    const extracted = await runOCR(filePath);

    let verificationResult = null;
    let docType = null;

    // Step 2: Route to Aadhaar/PAN verify
    if (extracted.aadhaar_number) {
      docType = "Aadhaar";
      verificationResult = await verifyAadhaar(extracted.aadhaar_number);
      if (!verificationResult) {
        verificationResult = { valid: false, message: "Aadhaar not found in database" };
      }
    } else if (extracted.pan_number) {
      docType = "PAN";
      verificationResult = await verifyPAN(extracted.pan_number);
      if (!verificationResult) {
        verificationResult = { valid: false, message: "PAN not found in database" };
      }
    } else {
      docType = "Unknown";
      verificationResult = { valid: false, message: "Could not detect Aadhaar or PAN number" };
    }

    // Step 3: Delete the temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    // Step 4: Return combined response
    res.json({
      success: true,
      documentType: docType,
      extracted,
      verification: verificationResult
    });

  } catch (err) {
    // Delete file even if OCR/verification fails
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error("Error deleting file:", unlinkErr);
    });
    res.status(500).json({ success: false, error: err.message });
  }
};
