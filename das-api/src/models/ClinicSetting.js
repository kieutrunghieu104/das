import mongoose from "mongoose";

const clinicSettingSchema = new mongoose.Schema({
  key: String,
  clinicName: String,
  hotline: String,
  address: String,
  faqs: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true,
  collection: "clinicsettings",
  versionKey: false
});

export default mongoose.models.clinicsettings || mongoose.model("clinicsettings", clinicSettingSchema);
