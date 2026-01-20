import { Comment } from "../domain/comment.interface";
import * as commentRepository from "../ports/comment.repository";

export const getComment = async (id: number): Promise<Comment> => {
  const comment = await commentRepository.findCommentById(id);

  if (!comment) {
    throw new Error("Comment not found");
  }

  return comment;
};
