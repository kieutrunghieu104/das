import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  title: String,
  message: String,
  type: String,
  isRead: Boolean
}, {
  timestamps: true,
  collection: "notifications",
  strict: false,
  versionKey: false
});

export default mongoose.models.notifications || mongoose.model("notifications", notificationSchema);
