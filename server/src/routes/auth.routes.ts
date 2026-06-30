import { Router } from "express";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  me,
} from "../controllers/auth.controller.js";
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
} from "../validators/auth.validator.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Public auth routes
router.post("/register", validate(registerSchema), register);
router.get("/verify-user/:token", verifyEmail);
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  resendVerification
);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected auth route
router.get("/me", protect, me);

export const authRoutes = router;
export default router;
