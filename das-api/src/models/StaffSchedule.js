import mongoose from "mongoose";

const staffScheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "timeslots" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "clinicrooms" },
  workDate: Date,
  startTime: String,
  endTime: String,
  status: String
}, {
  timestamps: true,
  collection: "staffschedules",
  strict: false,
  versionKey: false
});

export default mongoose.models.staffschedules || mongoose.model("staffschedules", staffScheduleSchema);
