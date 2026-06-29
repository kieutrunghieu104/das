import mongoose from "mongoose";

const clinicSettingSchema = new mongoose.Schema({
  key: String,
  clinicName: String,
  hotline: String,
  address: String,
  branches: [mongoose.Schema.Types.Mixed],
  faqs: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true,
  collection: "clinicsettings",
  strict: false,
  versionKey: false
});

export default mongoose.models.clinicsettings || mongoose.model("clinicsettings", clinicSettingSchema);
