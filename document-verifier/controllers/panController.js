import { verifyPAN } from "../services/panService.js";

export const panVerification = async (req, res) => {
  const { pan_number } = req.body;
  if (!pan_number) {
    return res.status(400).json({ success: false, message: "PAN number required" });
  }

  try {
    const result = await verifyPAN(pan_number);
    if (!result) {
      return res.status(404).json({ success: false, message: "Invalid PAN" });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
