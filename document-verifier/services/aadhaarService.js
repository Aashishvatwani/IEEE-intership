import User from "../models/User.js";

export const verifyAadhaar = async (aadhaar_number) => {
  const result = await User.findOne({ aadhaar_number });
  if (!result) return null;

  // Convert Mongoose doc → plain object
  const userObj = result.toObject ? result.toObject() : result;

  // Remove aadhaar_number before returning
  delete userObj.aadhaar_number;
  delete userObj._id;

  return userObj;
};
