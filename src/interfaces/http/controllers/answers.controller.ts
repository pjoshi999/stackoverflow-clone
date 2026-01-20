import { Response } from "express";
import { AuthRequest } from "../../../shared/types/types";
import * as createAnswerService from "../../../core/answers/use-cases/create-answer.service";
import * as voteService from "../../../core/questions/use-cases/vote.service";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { question_id, body } = req.body;
    const answer = await createAnswerService.createAnswer({
      question_id,
      user_id: req.userId!,
      body,
    });
    res.status(201).json(answer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const voteOnAnswer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const answerId = parseInt(req.params.id);
    const { vote_type } = req.body;
    await voteService.vote(req.userId!, "answer", answerId, vote_type);
    res.status(200).json({ message: "Vote recorded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
