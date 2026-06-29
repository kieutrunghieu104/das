import mongoose from "mongoose";

const dentistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  qualification: String,
  experienceYears: Number,
  description: String,
  status: String
}, {
  timestamps: true,
  collection: "dentists",
  strict: false,
  versionKey: false
});

export default mongoose.models.dentists || mongoose.model("dentists", dentistSchema);
