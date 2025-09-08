import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import uploadRoutes from "./routes/uploadRoutes.js";
import aadhaarRoutes from "./routes/aadhaarRoutes.js";
import panRoutes from "./routes/panRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";

// Load .env variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("open", () => console.log("✅ MongoDB connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err));

// Routes
app.use("/upload", uploadRoutes);
app.use("/aadhaar", aadhaarRoutes);
app.use("/pan", panRoutes);
app.use("/qr", qrRoutes);

app.get("/", (req, res) => res.send("🚀 Document Verifier API running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
