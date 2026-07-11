import { Router } from "express";
import {
  createTreatmentRecord,
  deleteTreatmentRecord,
  getDashboard,
  getPatientHistory,
  getPatientInformation,
  getTreatmentRecords,
  searchTreatmentRecordsByPhone,
  updateClinicalRoomStatus,
  updatePerformedServices,
  updateTreatmentRecord,
  upsertAppointmentTreatmentRecord
} from "../controllers/clinicalController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("dentist", "nurse", "admin"));

router.get("/dashboard", getDashboard);
router.get("/treatment-records", getTreatmentRecords);
router.get("/treatment-records/search", authorize("dentist", "nurse", "admin"), searchTreatmentRecordsByPhone);
router.post("/treatment-records", authorize("nurse", "admin"), createTreatmentRecord);
router.put("/treatment-records/:recordId", authorize("nurse", "admin"), updateTreatmentRecord);
router.delete("/treatment-records/:recordId", authorize("nurse", "admin"), deleteTreatmentRecord);
router.get("/patients/:patientId/history", getPatientHistory);
router.get("/patients/:patientId", getPatientInformation);
router.put("/appointments/:appointmentId/treatment-record", authorize("dentist", "nurse", "admin"), upsertAppointmentTreatmentRecord);
router.put("/appointments/:appointmentId/performed-services", authorize("nurse", "admin"), updatePerformedServices);
router.patch("/rooms/:id/status", authorize("nurse", "admin"), updateClinicalRoomStatus);

export default router;
