import mongoose from "mongoose";

const receptionistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  address: String,
  avatarUrl: String,
  bio: String
}, {
  timestamps: true,
  collection: "receptionists",
  versionKey: false
});

export default mongoose.models.receptionists || mongoose.model("receptionists", receptionistSchema);
