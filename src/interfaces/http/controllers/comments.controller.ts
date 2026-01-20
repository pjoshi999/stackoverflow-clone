import { Response } from "express";
import { AuthRequest } from "../../../shared/types/types";
import * as createCommentService from "../../../core/comments/use-cases/create-comment.service";
import * as getCommentService from "../../../core/comments/use-cases/get-comment.service";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { commentable_type, commentable_id, body } = req.body;
    const comment = await createCommentService.createComment({
      user_id: req.userId!,
      commentable_type,
      commentable_id,
      body,
    });
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const comment = await getCommentService.getComment(Number(id));
    res.status(200).json(comment);
  } catch (error: any) {
    if (error.message === "Comment not found") {
      res.status(404).json({ error: "Comment not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
