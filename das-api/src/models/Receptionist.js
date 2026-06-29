import mongoose from "mongoose";

const receptionistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  status: String
}, {
  timestamps: true,
  collection: "receptionists",
  strict: false,
  versionKey: false
});

export default mongoose.models.receptionists || mongoose.model("receptionists", receptionistSchema);
