import mongoose from "mongoose";

const consultationRequestSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  email: String,
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" },
  message: String,
  status: String,
  preferredDate: Date,
  preferredTime: String,
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" }
}, {
  timestamps: true,
  collection: "consultationrequests",
  strict: false,
  versionKey: false
});

export default mongoose.models.consultationrequests || mongoose.model("consultationrequests", consultationRequestSchema);
