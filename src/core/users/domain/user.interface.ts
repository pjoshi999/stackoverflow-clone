export interface UserProfile {
  id: number;
  username: string;
  email: string;
  reputation: number;
  created_at: Date;
  question_count: number;
  answer_count: number;
  recent_questions?: any[];
  recent_answers?: any[];
}

export interface UserRepository {
  getProfile(userId: number): Promise<UserProfile | null>;
  getTopUsers(limit: number): Promise<UserProfile[]>;
}
