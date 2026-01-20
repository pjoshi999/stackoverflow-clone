export interface Answer {
  id: number;
  question_id: number;
  user_id: number;
  body: string;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAnswerDTO {
  question_id: number;
  user_id: number;
  body: string;
}
