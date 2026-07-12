import { Router } from "express";
import {
  createConsultation,
  getAvailability,
  getBootstrap,
  getDentistById,
  getDentistReviews,
  getDentists,
  getHealth,
  getReviews,
  getRooms,
  getServices
} from "../controllers/publicController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/services", getServices);
router.get("/bootstrap", getBootstrap);
router.get("/reviews", getReviews);
router.get("/dentists", getDentists);
router.get("/dentists/:id", getDentistById);
router.get("/dentists/:id/reviews", getDentistReviews);
router.get("/rooms", getRooms);
router.get("/availability", getAvailability);
router.post("/consultations", createConsultation);

export default router;
