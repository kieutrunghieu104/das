import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  roleName: String,
  parentRoleName: String,
  isAbstract: Boolean,
  inheritanceChain: [String],
  description: String
}, {
  timestamps: true,
  collection: "roles",
  strict: false,
  versionKey: false
});

export default mongoose.models.roles || mongoose.model("roles", roleSchema);
