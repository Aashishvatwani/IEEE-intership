import express from "express";

const router = express.Router();

// Generate QR code data for any document
router.post("/generate", (req, res) => {
  const { documentType, hash, fileName } = req.body;
  
  if (!hash) {
    return res.status(400).json({ 
      success: false, 
      message: "Document hash is required" 
    });
  }

  try {
    let qrData = '';
    
    if (documentType === 'aadhaar') {
      qrData = `aadhaar:${hash}`;
    } else if (documentType === 'pan') {
      qrData = `pan:${hash}`;
    } else {
      // For other documents, use filename
      qrData = `${fileName || 'document'}:${hash}`;
    }
    
    res.json({
      success: true,
      qrData,
      documentType,
      hash,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
