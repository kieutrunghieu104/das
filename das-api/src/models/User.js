import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, trim: true, lowercase: true, sparse: true },
  phone: String,
  password: String,
  passwordHash: String,
  role: String,
  roleRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "roles"
  },
  status: String,
  gender: String,
  address: String,
  bio: String,
  avatar: String,
  avatarUrl: String,
  yearsOfExperience: Number
}, {
  timestamps: true,
  collection: "users",
  strict: false,
  versionKey: false
});

export default mongoose.models.users || mongoose.model("users", userSchema);
