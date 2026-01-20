export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  reputation: number;
  created_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  reputation: number;
}
