import { CommentWithUser, CommentableType } from "../domain/comment.interface";
import * as commentRepository from "../ports/comment.repository";

export const listComments = async (
  commentableType: CommentableType,
  commentableId: number,
): Promise<CommentWithUser[]> => {
  return await commentRepository.findCommentsByCommentable(
    commentableType,
    commentableId,
  );
};
