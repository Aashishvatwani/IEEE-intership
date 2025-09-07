import express from "express";
import { aadhaarVerification } from "../controllers/aadhaarController.js";

const router = express.Router();

router.post("/verify", aadhaarVerification);

export default router;
