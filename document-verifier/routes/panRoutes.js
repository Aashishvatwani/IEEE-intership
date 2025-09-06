import express from "express";
import { panVerification } from "../controllers/panController.js";

const router = express.Router();

router.post("/verify", panVerification);

export default router;
