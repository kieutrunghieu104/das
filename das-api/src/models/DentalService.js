import mongoose from "mongoose";

const dentalServiceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: String,
  isActive: Boolean
}, {
  timestamps: true,
  collection: "dentalservices",
  strict: false,
  versionKey: false
});

export default mongoose.models.dentalservices || mongoose.model("dentalservices", dentalServiceSchema);
