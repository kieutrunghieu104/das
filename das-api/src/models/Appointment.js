import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  receptionist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  confirmationBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  nurse: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "clinicrooms" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "dentalservices" },
  channel: String,
  dentistPreference: String,
  startAt: Date,
  endAt: Date,
  arrivalAt: Date,
  status: String,
  paymentStatus: String,
  patientNote: String,
  receptionistNote: String,
  confirmationCalledAt: Date,
  confirmationNote: String,
  checkedInAt: Date,
  checkInTime: Date,
  cancelledAt: Date,
  cancelledByRole: String,
  cancellationReason: String,
  performedTotal: Number,
  performedServices: [mongoose.Schema.Types.Mixed],
  extraCosts: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true,
  collection: "appointments",
  versionKey: false
});

export default mongoose.models.appointments || mongoose.model("appointments", appointmentSchema);
