import mongoose from "mongoose";

const clinicRoomSchema = new mongoose.Schema({
  name: String,
  assignedDentist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  assignedNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  status: String
}, {
  timestamps: true,
  collection: "clinicrooms",
  versionKey: false
});

export default mongoose.models.clinicrooms || mongoose.model("clinicrooms", clinicRoomSchema);
