import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepo from "../ports/user.repository";
import { CreateUserDTO, UserResponse } from "../domain/user.interface";
import { jwtConfig } from "../../../config/env";

interface RegisterResult {
  token: string;
  user: UserResponse;
}

export const registerUser = async (
  dto: CreateUserDTO,
): Promise<RegisterResult> => {
  const existingUser = await userRepo.findUserByEmail(dto.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const existingUsername = await userRepo.findUserByUsername(dto.username);
  if (existingUsername) {
    throw new Error("User with this username already exists");
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const user = await userRepo.createUser(dto, passwordHash);

  const token = (jwt.sign as any)({ userId: user.id }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      reputation: user.reputation,
    },
  };
};
