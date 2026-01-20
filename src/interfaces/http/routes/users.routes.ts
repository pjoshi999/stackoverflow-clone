import { Router } from "express";
import { controllers } from "../container";

const router = Router();

router.get("/top", controllers.users.getTop);
router.get("/:id", controllers.users.getProfile);

export default router;
