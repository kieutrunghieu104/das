import { Router } from "express";
import {
  cancelAppointment,
  checkInAppointment,
  createAppointment,
  createInvoiceForAppointment,
  deleteEmptyInvoiceAppointment,
  getAppointmentById,
  getAppointmentInvoice,
  getAppointments,
  getServicesForPayment,
  markNoShow,
  processAppointmentPayment,
  recordConfirmationCall,
  rescheduleAppointment,
  scheduleByReception,
  updateAppointmentStatus
} from "../controllers/appointmentController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getAppointments);
router.get("/meta/services-for-payment", getServicesForPayment);
router.get("/:id", getAppointmentById);
router.post("/", createAppointment);
router.patch("/:id/reschedule", rescheduleAppointment);
router.patch("/:id/reception-schedule", authorize("receptionist", "admin"), scheduleByReception);
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/status", authorize("receptionist", "admin", "nurse"), updateAppointmentStatus);
router.patch("/:id/confirmation-call", authorize("receptionist", "admin"), recordConfirmationCall);
router.patch("/:id/check-in", authorize("receptionist", "admin"), checkInAppointment);
router.patch("/:id/no-show", authorize("receptionist", "admin"), markNoShow);
router.post("/:id/invoice", authorize("receptionist", "admin"), createInvoiceForAppointment);
router.patch("/:id/payment", authorize("receptionist", "admin"), processAppointmentPayment);
router.delete("/:id/empty-invoice", authorize("receptionist", "admin"), deleteEmptyInvoiceAppointment);
router.get("/:id/invoice", getAppointmentInvoice);

export default router;
