import mongoose from "mongoose";

const appointmentSlotSchema = new mongoose.Schema({
  slotName: String,
  startTime: String,
  endTime: String,
  order: Number
}, {
  timestamps: true,
  collection: "appointmentslots",
  versionKey: false
});

export default mongoose.models.appointmentslots || mongoose.model("appointmentslots", appointmentSlotSchema);
