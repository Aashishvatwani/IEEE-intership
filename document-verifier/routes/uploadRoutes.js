import express from "express";
import multer from "multer";

import { uploadDocument, detectDocumentType } from "../controllers/uploadController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type. Only JPG, PNG, PDF allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// Document type detection endpoint
router.post("/detect-type", detectDocumentType);

// Handle both file uploads and IPFS CID verification
router.post("/", (req, res, next) => {
  // If request has ipfsCID in body, skip multer
  if (req.body && req.body.ipfsCID) {
    return uploadDocument(req, res);
  }
  // Otherwise use multer for file upload
  upload.single("document")(req, res, next);
}, uploadDocument);

export default router;
