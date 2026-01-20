import * as commentRepo from "../ports/comment.repository";
import { CreateCommentDTO, Comment } from "../domain/comment.interface";

export const createComment = async (
  dto: CreateCommentDTO,
): Promise<Comment> => {
  return await commentRepo.createComment(dto);
};
