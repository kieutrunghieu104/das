import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "invoices" },
  paymentMethod: String,
  installmentNumber: Number,
  amount: Number,
  paymentDate: Date
}, {
  timestamps: true,
  collection: "payments",
  strict: false,
  versionKey: false
});

export default mongoose.models.payments || mongoose.model("payments", paymentSchema);
