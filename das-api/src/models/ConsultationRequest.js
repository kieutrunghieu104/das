import mongoose from "mongoose";

const consultationRequestSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  gender: String,
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" },
  status: {
    type: String,
    default: "waiting"
  },
  contactedAt: Date
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: "consultationrequests",
  versionKey: false
});

export default mongoose.models.consultationrequests || mongoose.model("consultationrequests", consultationRequestSchema);
