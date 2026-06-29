import { Router } from "express";
import {
  getDashboard,
  getInvoiceById,
  getInvoices,
  getNotifications,
  getTreatmentRecords,
  markNotificationRead,
  payInvoice,
  submitReview
} from "../controllers/patientController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("patient"));

router.get("/dashboard", getDashboard);
router.get("/invoices", getInvoices);
router.get("/invoices/:id", getInvoiceById);
router.patch("/invoices/:id/pay", payInvoice);
router.get("/treatment-records", getTreatmentRecords);
router.post("/reviews", submitReview);
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);

export default router;
