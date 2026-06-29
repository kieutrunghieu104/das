import { Router } from "express";
import {
  createPatient,
  deleteConsultation,
  getConsultations,
  getDashboard,
  getPatients,
  getRooms,
  resetPatientPassword,
  updateConsultation,
  updateRoomStatus
} from "../controllers/receptionController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("receptionist", "admin"));

router.get("/dashboard", getDashboard);
router.get("/patients", getPatients);
router.patch("/patients/:id/reset-password", resetPatientPassword);
router.post("/patients", createPatient);
router.get("/consultations", getConsultations);
router.patch("/consultations/:id", updateConsultation);
router.delete("/consultations/:id", deleteConsultation);
router.get("/rooms", getRooms);
router.patch("/rooms/:id/status", updateRoomStatus);

export default router;
