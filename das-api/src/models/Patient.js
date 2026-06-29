import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  gender: String,
  address: String,
  medicalNote: String
}, {
  timestamps: true,
  collection: "patients",
  strict: false,
  versionKey: false
});

export default mongoose.models.patients || mongoose.model("patients", patientSchema);
