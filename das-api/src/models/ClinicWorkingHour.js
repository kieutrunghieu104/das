import mongoose from "mongoose";

const clinicWorkingHourSchema = new mongoose.Schema({
  dayOfWeek: Number,
  shiftName: String,
  startTime: String,
  endTime: String,
  status: String
}, {
  timestamps: true,
  collection: "clinicworkinghours",
  strict: false,
  versionKey: false
});

export default mongoose.models.clinicworkinghours || mongoose.model("clinicworkinghours", clinicWorkingHourSchema);
