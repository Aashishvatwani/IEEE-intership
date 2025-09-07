import { verifyAadhaar } from "../services/aadhaarService.js";

export const aadhaarVerification = async (req, res) => {
  const { aadhaar_number } = req.body;
  if (!aadhaar_number) {
    return res.status(400).json({ success: false, message: "Aadhaar number required" });
  }

  try {
    const result = await verifyAadhaar(aadhaar_number);
    if (!result) {
      return res.status(404).json({ success: false, message: "Invalid Aadhaar" });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
