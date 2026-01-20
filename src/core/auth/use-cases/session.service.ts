import jwt from "jsonwebtoken";
import * as sessionRepo from "../ports/session.repository";
import * as userRepo from "../ports/user.repository";
import { jwtConfig } from "../../../config/env";
import { UserResponse } from "../domain/user.interface";

interface RefreshSessionResult {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export const refreshSession = async (
  token: string,
): Promise<RefreshSessionResult> => {
  // 1. Verify token signature
  let decoded: any;
  try {
    decoded = jwt.verify(token, jwtConfig.refreshSecret as string);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  // 2. Check if session exists in DB and is not revoked
  const session = await sessionRepo.findSession(token);
  if (!session || session.revoked) {
    // Security: If a revoked token is used, it might be token theft.
    // We should revoke all sessions for this user (Reuse Detection).
    if (session && session.revoked) {
      await sessionRepo.revokeAllUserSessions(session.user_id);
    }
    throw new Error("Invalid refresh token");
  }

  // 3. Check if user still exists
  const user = await userRepo.findUserById(decoded.userId);
  if (!user) {
    throw new Error("User not found");
  }

  // 4. Token Rotation: Revoke the old session
  await sessionRepo.revokeSession(token);

  // 5. Generate NEW tokens
  const newAccessToken = (jwt.sign as any)(
    { userId: user.id },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
    },
  );

  const newRefreshToken = (jwt.sign as any)(
    { userId: user.id, type: "refresh" },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    },
  );

  // 6. Save NEW session
  const decodedNewRefresh = jwt.decode(newRefreshToken) as any;
  const expiresAt = new Date(decodedNewRefresh.exp * 1000);
  await sessionRepo.createSession(user.id, newRefreshToken, expiresAt);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      reputation: user.reputation,
    },
  };
};
