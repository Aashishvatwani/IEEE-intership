import User from "../models/User.js";

export const verifyPAN = async (pan_number) => {
  const result = await User.findOne({ pan_number });
  if (!result) return null;

  const userObj = result.toObject ? result.toObject() : result;
  delete userObj.pan_number;
  delete userObj._id;

  return userObj;
};
