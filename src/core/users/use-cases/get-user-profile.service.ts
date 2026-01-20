import * as userProfileRepo from "../ports/user-profile.repository";
import { UserProfile } from "../domain/user-profile.interface";

export const getUserProfile = async (
  userId: number,
): Promise<UserProfile | null> => {
  return await userProfileRepo.getUserProfile(userId);
};
