import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  gender: String,
  address: String,
  medicalNote: String,
  avatarUrl: String,
  bio: String
}, {
  timestamps: true,
  collection: "patients",
  versionKey: false
});

export default mongoose.models.patients || mongoose.model("patients", patientSchema);
