import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "appointments" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  items: [mongoose.Schema.Types.Mixed],
  subtotal: Number,
  discountPercent: Number,
  discountAmount: Number,
  total: Number,
  paidAmount: Number,
  paymentPlan: String,
  installmentMonths: Number,
  installmentAmount: Number,
  status: String,
  invoiceDate: Date,
  paidAt: Date
}, {
  timestamps: true,
  collection: "invoices",
  versionKey: false
});

export default mongoose.models.invoices || mongoose.model("invoices", invoiceSchema);
