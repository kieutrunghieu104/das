import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  slotName: String,
  startTime: String,
  endTime: String,
  status: String
}, {
  timestamps: true,
  collection: "timeslots",
  strict: false,
  versionKey: false
});

export default mongoose.models.timeslots || mongoose.model("timeslots", timeSlotSchema);
