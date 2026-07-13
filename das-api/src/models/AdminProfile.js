import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  position: String,
  permissionLevel: String,
  gender: String,
  address: String,
  avatarUrl: String,
  bio: String
}, {
  timestamps: true,
  collection: "adminprofiles",
  versionKey: false
});

export default mongoose.models.adminprofiles || mongoose.model("adminprofiles", adminProfileSchema);
