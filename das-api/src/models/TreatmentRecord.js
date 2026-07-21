import mongoose from "mongoose";

const treatmentRecordSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "appointments" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  nurse: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  serviceSnapshot: mongoose.Schema.Types.Mixed,
  initialInfo: mongoose.Schema.Types.Mixed,
  treatmentDate: String,
  visits: [mongoose.Schema.Types.Mixed],
  status: String
}, {
  timestamps: true,
  collection: "treatmentrecords",
  versionKey: false
});

export default mongoose.models.treatmentrecords || mongoose.model("treatmentrecords", treatmentRecordSchema);
