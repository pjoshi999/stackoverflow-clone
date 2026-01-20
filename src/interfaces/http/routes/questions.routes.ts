import { Router } from "express";
import * as questionsController from "../controllers/questions.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createQuestionSchema,
  listQuestionsSchema,
  voteSchema,
  questionIdSchema,
} from "../validations/questions.validations";

const router = Router();

router.get(
  "/",
  validate(listQuestionsSchema, "query"),
  questionsController.list,
);

router.get(
  "/:id",
  validate(questionIdSchema, "params"),
  questionsController.getById,
);

router.post(
  "/",
  authenticate,
  validate(createQuestionSchema),
  questionsController.create,
);

router.post(
  "/:id/vote",
  authenticate,
  validate(questionIdSchema, "params"),
  validate(voteSchema),
  questionsController.voteOnQuestion,
);

export default router;
