import { Router } from "express";
import { controllers } from "../container";

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", authenticate, controllers.users.getMe);
router.get("/top", controllers.users.getTop);
router.get("/:id", controllers.users.getProfile);

export default router;
