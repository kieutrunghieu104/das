import mongoose from "mongoose";

const clinicRoomSchema = new mongoose.Schema({
  name: String,
  roomType: String,
  assignedDentist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  assignedNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  equipment: [String],
  status: String,
  isActive: Boolean
}, {
  timestamps: true,
  collection: "clinicrooms",
  strict: false,
  versionKey: false
});

export default mongoose.models.clinicrooms || mongoose.model("clinicrooms", clinicRoomSchema);
