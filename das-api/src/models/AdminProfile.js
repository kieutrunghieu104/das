import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  position: String,
  permissionLevel: String,
  status: String
}, {
  timestamps: true,
  collection: "adminprofiles",
  strict: false,
  versionKey: false
});

export default mongoose.models.adminprofiles || mongoose.model("adminprofiles", adminProfileSchema);
