import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  dob: String,
  aadhaar_number: String,
  pan_number: String,
  gender: String,
  fatherName: String,
  rollNumber: String,
  totalMarks: String,
});

const User = mongoose.model("User", userSchema);

export default User;
