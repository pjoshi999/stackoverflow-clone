import { Router } from "express";
import * as answersController from "../controllers/answers.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createAnswerSchema,
  voteSchema,
  answerIdSchema,
} from "../validations/answers.validations";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createAnswerSchema),
  answersController.create,
);

router.post(
  "/:id/vote",
  authenticate,
  validate(answerIdSchema, "params"),
  validate(voteSchema),
  answersController.voteOnAnswer,
);

export default router;
