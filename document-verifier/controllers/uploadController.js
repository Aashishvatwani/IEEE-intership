import fs from 'fs';
import { runOCR } from "../services/ocrService.js";
import { validateDocument } from "../services/documentValidation.js";
import logger from "../services/logger.js";

export const detectDocumentType = async (req, res) => {
  // Detect document type from IPFS CID without full verification
  if (!req.body.ipfsCID) {
    return res.status(400).json({ 
      success: false, 
      message: "IPFS CID is required for document type detection" 
    });
  }

  let filePath = null;

  try {
    const { ipfsCID, fileName } = req.body;
    
    // Download file from IPFS
    const response = await fetch(`https://ipfs.io/ipfs/${ipfsCID}`);
    if (!response.ok) {
      return res.status(400).json({ 
        success: false, 
        message: "Failed to download file from IPFS" 
      });
    }
    
    const buffer = await response.arrayBuffer();
    const tempFileName = `temp-detect-${Date.now()}-${fileName}`;
    filePath = `uploads/${tempFileName}`;
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    
    fs.writeFileSync(filePath, Buffer.from(buffer));

    logger.info("Document type detection started", { ipfsCID, fileName });

    // Run OCR to detect document type
    const extracted = await runOCR(filePath);
    console.log("OCR Result for type detection:", extracted);
    
    const detectedType = extracted.document_type || "other";
    
    logger.info("Document type detection completed", { 
      detectedType,
      hasAadhaar: !!extracted.aadhaar_number,
      hasPAN: !!extracted.pan_number 
    });

    // Clean up temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      documentType: detectedType,
      confidence: extracted.confidence || 0.8 // Default confidence if not provided
    });

  } catch (error) {
    console.error("Document type detection error:", error);
    logger.error("Document type detection failed", { 
      error: error.message,
      ipfsCID: req.body.ipfsCID 
    });

    // Clean up temporary file if it exists
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(500).json({
      success: false,
      message: "Document type detection failed: " + error.message
    });
  }
};

export const uploadDocument = async (req, res) => {
  // Handle both file upload and IPFS CID verification
  let filePath = null;
  let isIPFSFile = false;

  if (req.file) {
    // Traditional file upload
    filePath = req.file.path;
  } else if (req.body.ipfsCID) {
    // IPFS CID provided - download file from IPFS
    const { ipfsCID, documentType, fileName } = req.body;
    
    try {
      // Download file from IPFS
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsCID}`);
      if (!response.ok) {
        return res.status(400).json({ 
          success: false, 
          message: "Failed to download file from IPFS" 
        });
      }
      
      const buffer = await response.arrayBuffer();
      const tempFileName = `temp-${Date.now()}-${fileName}`;
      filePath = `uploads/${tempFileName}`;
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
      }
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      isIPFSFile = true;
      
      // Store the provided document type for later use
      req.providedDocumentType = documentType;
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to process IPFS file: " + error.message 
      });
    }
  } else {
    return res.status(400).json({ 
      success: false, 
      message: "No file uploaded or IPFS CID provided" 
    });
  }

  try {
    logger.info("Document processing started", { 
      isIPFSFile, 
      hasFile: !!req.file,
      ipfsCID: req.body?.ipfsCID 
    });

    // Step 1: OCR
    const extracted = await runOCR(filePath);
    console.log("OCR Result:", extracted);
    logger.info("OCR completed", { 
      documentType: extracted.document_type,
      hasAadhaar: !!extracted.aadhaar_number,
      hasPAN: !!extracted.pan_number 
    });

    // Step 2: Determine document type - use provided type if available, otherwise OCR detection
    let docType;
    if (req.providedDocumentType && req.providedDocumentType !== 'auto-detect') {
      docType = req.providedDocumentType;
      logger.info("Using provided document type", { providedType: docType, ocrType: extracted.document_type });
    } else {
      docType = extracted.document_type || "unknown";
      logger.info("Using OCR detected document type", { ocrType: docType });
    }
    
    // Step 3: Enhanced document validation
    const verificationResult = await validateDocument(extracted, docType);
    
    // Log verification result
    if (verificationResult.suspiciousActivity) {
      logger.suspicious("Suspicious document detected", {
        documentType: docType,
        reason: verificationResult.reason,
        confidence: verificationResult.confidence
      });
    } else if (verificationResult.valid) {
      logger.verification("Document verified successfully", {
        documentType: docType,
        confidence: verificationResult.confidence
      });
    } else {
      logger.warn("Document verification failed", {
        documentType: docType,
        reason: verificationResult.reason
      });
    }

    // Step 4: Delete the temporary file
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error("Error deleting temporary file", { filePath, error: err.message });
      } else {
        logger.info("Temporary file deleted", { filePath });
      }
    });

    // Step 5: Return comprehensive response
    res.json({
      success: true,
      documentType: docType,
      extracted,
      verification: verificationResult,
      isIPFSFile,
      processingTime: new Date().toISOString()
    });

  } catch (err) {
    logger.error("Document processing failed", { 
      error: err.message,
      stack: err.stack,
      filePath 
    });
    
    // Delete file even if OCR/verification fails
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        logger.error("Error deleting file after processing failure", { 
          filePath, 
          error: unlinkErr.message 
        });
      }
    });
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
