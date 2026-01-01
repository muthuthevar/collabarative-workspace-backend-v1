import { Router } from "express";
import { AuthController } from "../controllers/user.controller.js";
import { UserService } from "../services/User.service.js";
import { UserRepository } from "../repositories/implementations/User.repository.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from "../validators/user.validator.js";

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const authController = new AuthController(userService);

// Public routes
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

// Protected routes
router.get(
  "/profile",
  authenticate,
  authController.getProfile.bind(authController)
);

router.put(
  "/profile",
  authenticate,
  validate(updateUserSchema),
  authController.updateProfile.bind(authController)
);

router.delete(
  "/account",
  authenticate,
  authController.deleteAccount.bind(authController)
);

export default router;
