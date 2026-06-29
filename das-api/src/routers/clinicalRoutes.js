import { Router } from "express";
import {
  getDashboard,
  getPatientHistory,
  getPatientInformation,
  getSchedule,
  getTreatmentRecords,
  getWorkSchedules,
  updateClinicalRoomStatus,
  updatePerformedServices,
  upsertAppointmentTreatmentRecord
} from "../controllers/clinicalController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("dentist", "nurse", "admin"));

router.get("/dashboard", getDashboard);
router.get("/work-schedules", getWorkSchedules);
router.get("/schedule", getSchedule);
router.get("/treatment-records", getTreatmentRecords);
router.get("/patients/:patientId/history", getPatientHistory);
router.get("/patients/:patientId", getPatientInformation);
router.put("/appointments/:appointmentId/treatment-record", authorize("dentist", "nurse", "admin"), upsertAppointmentTreatmentRecord);
router.put("/appointments/:appointmentId/performed-services", authorize("nurse", "admin"), updatePerformedServices);
router.patch("/rooms/:id/status", authorize("nurse", "admin"), updateClinicalRoomStatus);

export default router;
