import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  roleName: String
}, {
  timestamps: true,
  collection: "roles",
  versionKey: false
});

export default mongoose.models.roles || mongoose.model("roles", roleSchema);
