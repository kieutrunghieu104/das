import mongoose from "mongoose";

const dentistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  qualification: String,
  experienceYears: Number,
  description: String,
  gender: String,
  address: String,
  avatarUrl: String
}, {
  timestamps: true,
  collection: "dentists",
  versionKey: false
});

export default mongoose.models.dentists || mongoose.model("dentists", dentistSchema);
