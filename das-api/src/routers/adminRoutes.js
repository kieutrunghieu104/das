import { Router } from "express";
import {
  createClinicRoom,
  createDentalService,
  createUser,
  deactivateDentalService,
  deleteClinicRoom,
  getDashboard,
  getPatientStatistics,
  getRevenueReport,
  getStats,
  getUsers,
  resetUserPassword,
  updateClinicRoom,
  updateDentalService,
  updateReviewVisibility,
  updateUser,
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
