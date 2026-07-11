import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  markAllNotificationsRead,
  markNotificationRead,
  me,
  notifications,
  removeAllNotifications,
  removeNotification,
  register,
  resetPassword,
  updateProfile
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema
} from "../validations/authValidation.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);
router.post("/logout", requireAuth, logout);

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validateBody(updateProfileSchema), updateProfile);
router.get("/notifications", requireAuth, notifications);
router.patch("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.delete("/notifications", requireAuth, removeAllNotifications);
router.patch("/notifications/:id/read", requireAuth, markNotificationRead);
router.delete("/notifications/:id", requireAuth, removeNotification);
router.patch("/change-password", requireAuth, validateBody(changePasswordSchema), changePassword);

export default router;
