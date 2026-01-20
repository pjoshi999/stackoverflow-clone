import { Router } from "express";
import * as commentsController from "../controllers/comments.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { createCommentSchema } from "../validations/comments.validations";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createCommentSchema),
  commentsController.create,
);

router.get("/:id", commentsController.getComment);

export default router;
