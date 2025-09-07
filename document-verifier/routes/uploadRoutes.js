import express from "express";
import multer from "multer";

import { uploadDocument } from "../controllers/uploadController.js";

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

// ✅ Use the correct controller function name
router.post("/", upload.single("document"), uploadDocument);

export default router;
