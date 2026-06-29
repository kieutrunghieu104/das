import mongoose from "mongoose";

const dentistServiceSchema = new mongoose.Schema({
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" }
}, {
  timestamps: true,
  collection: "dentistservices",
  strict: false,
  versionKey: false
});

export default mongoose.models.dentistservices || mongoose.model("dentistservices", dentistServiceSchema);
