import mongoose from "mongoose";

const roomStatusSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "clinicrooms" },
  nurse: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  availabilityStatus: String,
  note: String
}, {
  timestamps: true,
  collection: "roomstatuses",
  strict: false,
  versionKey: false
});

export default mongoose.models.roomstatuses || mongoose.model("roomstatuses", roomStatusSchema);
