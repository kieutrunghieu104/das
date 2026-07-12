import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  qualification: String,
  address: String,
  avatarUrl: String,
  bio: String
}, {
  timestamps: true,
  collection: "nurses",
  versionKey: false
});

export default mongoose.models.nurses || mongoose.model("nurses", nurseSchema);
