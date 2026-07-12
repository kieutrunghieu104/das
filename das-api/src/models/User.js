import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, trim: true, lowercase: true, sparse: true },
  phone: String,
  passwordHash: String,
  roleRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "roles"
  },
  status: String,
  resetPasswordCodeHash: String,
  resetPasswordExpiresAt: Date
}, {
  timestamps: true,
  collection: "users",
  versionKey: false
});

export default mongoose.models.users || mongoose.model("users", userSchema);
