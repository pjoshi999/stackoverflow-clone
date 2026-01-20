import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepo from "../ports/user.repository";
import { UserResponse } from "../domain/user.interface";
import { jwtConfig } from "../../../config/env";
import * as sessionRepo from "../ports/session.repository";

interface LoginResult {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  const token = (jwt.sign as any)({ userId: user.id }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  const refreshToken = (jwt.sign as any)(
    { userId: user.id, type: "refresh" },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    },
  );

  // Calculate expiry date from config or decoded token
  // Using jwt.decode to be accurate with the string format (e.g. "7d")
  const decodedRefresh = jwt.decode(refreshToken) as any;
  const expiresAt = new Date(decodedRefresh.exp * 1000);

  await sessionRepo.createSession(user.id, refreshToken, expiresAt);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      reputation: user.reputation,
    },
  };
};
