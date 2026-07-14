import mongoose from "mongoose";

const appointmentSlotClosureSchema = new mongoose.Schema({
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "appointmentslots" },
  date: String,
  isClosed: Boolean
}, {
  timestamps: true,
  collection: "appointmentslotclosures",
  versionKey: false
});

export default mongoose.models.appointmentslotclosures || mongoose.model("appointmentslotclosures", appointmentSlotClosureSchema);
