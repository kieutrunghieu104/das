import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  qualification: String,
  status: String
}, {
  timestamps: true,
  collection: "nurses",
  strict: false,
  versionKey: false
});

export default mongoose.models.nurses || mongoose.model("nurses", nurseSchema);
