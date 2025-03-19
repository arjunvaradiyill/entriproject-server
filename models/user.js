import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isBanned: { type: Boolean, default: false },
});

export default mongoose.model("User", UserSchema);
