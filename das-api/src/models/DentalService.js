import mongoose from "mongoose";

const dentalServiceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: String
}, {
  timestamps: true,
  collection: "dentalservices",
  strict: false,
  versionKey: false
});

export default mongoose.models.dentalservices || mongoose.model("dentalservices", dentalServiceSchema);
