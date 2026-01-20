import { Response } from "express";
import { AuthRequest } from "../../../shared/types/types";
import * as createQuestionService from "../../../core/questions/use-cases/create-question.service";
import * as listQuestionsService from "../../../core/questions/use-cases/list-questions.service";
import * as getQuestionDetailsService from "../../../core/questions/use-cases/get-question-details.service";
import * as voteService from "../../../core/questions/use-cases/vote.service";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, body, tags } = req.body;
    const question = await createQuestionService.createQuestion({
      userId: req.userId!,
      title,
      body,
      tags,
    });
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = {
      q: req.query.q as string,
      tags: req.query.tags as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };
    const result = await listQuestionsService.listQuestions(query, req.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const questionId = parseInt(req.params.id);
    const question = await getQuestionDetailsService.getQuestionDetails(
      questionId,
      req.userId,
    );

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    res.status(200).json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const voteOnQuestion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const questionId = parseInt(req.params.id);
    const { vote_type } = req.body;
    await voteService.vote(req.userId!, "question", questionId, vote_type);
    res.status(200).json({ message: "Vote recorded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
