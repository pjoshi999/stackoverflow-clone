export interface Question {
  id: number;
  user_id: number;
  title: string;
  body: string;
  views: number;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  usage_count: number;
}

export type VoteType = "upvote" | "downvote";
export type VotableType = "question" | "answer";

export interface Vote {
  id: number;
  user_id: number;
  votable_type: VotableType;
  votable_id: number;
  vote_type: VoteType;
  created_at: Date;
}

export interface CreateQuestionDTO {
  title: string;
  body: string;
  tags: string[];
  userId: number;
}

export interface SearchQuestionQuery {
  q?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

export interface QuestionWithDetails extends Question {
  username?: string;
  tags?: Tag[];
  answers?: any[];
  comments?: any[];
  vote_count?: number;
  user_vote?: VoteType | null;
}
