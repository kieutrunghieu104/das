import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "appointments" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" },
  rating: Number,
  ratingDentist: Number,
  ratingService: Number,
  comment: String,
  isHidden: Boolean
}, {
  timestamps: true,
  collection: "reviews",
  strict: false,
  versionKey: false
});

export default mongoose.models.reviews || mongoose.model("reviews", reviewSchema);
