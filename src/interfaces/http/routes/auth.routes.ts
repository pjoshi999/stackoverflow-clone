import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validations/auth.validations";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);

export default router;
