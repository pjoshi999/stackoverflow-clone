import { Request } from "express";

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  reputation: number;
  created_at: Date;
}

export interface Question {
  id: number;
  user_id: number;
  title: string;
  body: string;
  views: number;
  created_at: Date;
  updated_at: Date;
  username?: string;
  tags?: Tag[];
  answers?: Answer[];
  comments?: Comment[];
  vote_count?: number;
  user_vote?: "upvote" | "downvote" | null;
}

export interface Answer {
  id: number;
  question_id: number;
  user_id: number;
  body: string;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
  username?: string;
  comments?: Comment[];
  vote_count?: number;
  user_vote?: "upvote" | "downvote" | null;
}

export interface Tag {
  id: number;
  name: string;
  usage_count: number;
}

export interface Comment {
  id: number;
  user_id: number;
  commentable_type: "question" | "answer";
  commentable_id: number;
  body: string;
  created_at: Date;
  username?: string;
}

export interface Vote {
  id: number;
  user_id: number;
  votable_type: "question" | "answer";
  votable_id: number;
  vote_type: "upvote" | "downvote";
  created_at: Date;
}

export interface AuthRequest extends Request {
  userId?: number;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateQuestionDTO {
  title: string;
  body: string;
  tags: string[];
}

export interface CreateAnswerDTO {
  question_id: number;
  body: string;
}

export interface CreateCommentDTO {
  commentable_type: "question" | "answer";
  commentable_id: number;
  body: string;
}

export interface VoteDTO {
  vote_type: "upvote" | "downvote";
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
  tags?: string;
}
