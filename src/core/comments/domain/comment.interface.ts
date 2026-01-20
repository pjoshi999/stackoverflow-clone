export type CommentableType = "question" | "answer";

export interface Comment {
  id: number;
  user_id: number;
  commentable_type: CommentableType;
  commentable_id: number;
  body: string;
  created_at: Date;
}

export interface CreateCommentDTO {
  user_id: number;
  commentable_type: CommentableType;
  commentable_id: number;
  body: string;
}

export interface CommentWithUser extends Comment {
  username: string;
  user_reputation: number;
}
