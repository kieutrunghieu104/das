import mongoose from "mongoose";

const appointmentSlotSchema = new mongoose.Schema({
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "clinicrooms" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" },
  slotDate: Date,
  startAt: Date,
  endAt: Date,
  status: String
}, {
  timestamps: true,
  collection: "appointmentslots",
  strict: false,
  versionKey: false
});

export default mongoose.models.appointmentslots || mongoose.model("appointmentslots", appointmentSlotSchema);
