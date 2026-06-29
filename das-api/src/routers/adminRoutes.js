import { Router } from "express";
import {
  createClinicRoom,
  createDentalService,
  createStaffSchedule,
  createUser,
  createWorkingHour,
  deactivateDentalService,
  deleteClinicRoom,
  exportReports,
  getDashboard,
  getPatientStatistics,
  getRevenueReport,
  getStaffSchedules,
  getStats,
  getUsers,
  getWorkingHours,
  resetUserPassword,
  updateClinicRoom,
  updateDentalService,
  updateReviewVisibility,
  updateStaffSchedule,
  updateUser,
  updateWorkingHour
} from "../controllers/adminController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("admin"));

router.get("/stats", getStats);
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.post("/users", createUser);
router.post("/users/:id/reset-password", resetUserPassword);
router.patch("/users/:id", updateUser);
router.get("/working-hours", getWorkingHours);
router.post("/working-hours", createWorkingHour);
router.patch("/working-hours/:id", updateWorkingHour);
router.get("/staff-schedules", getStaffSchedules);
router.post("/staff-schedules", createStaffSchedule);
router.patch("/staff-schedules/:id", updateStaffSchedule);
router.get("/reports/export", exportReports);
router.get("/reports/revenue", getRevenueReport);
router.get("/reports/patient-statistics", getPatientStatistics);
router.post("/services", createDentalService);
router.patch("/services/:id", updateDentalService);
router.delete("/services/:id", deactivateDentalService);
router.post("/rooms", createClinicRoom);
router.patch("/rooms/:id", updateClinicRoom);
router.delete("/rooms/:id", deleteClinicRoom);
router.patch("/reviews/:id", updateReviewVisibility);

export default router;
