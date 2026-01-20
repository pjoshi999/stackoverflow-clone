import * as userProfileRepo from "../ports/user-profile.repository";
import { UserProfile } from "../domain/user-profile.interface";

export const getTopUsers = async (
  limit: number = 10,
): Promise<UserProfile[]> => {
  return await userProfileRepo.getTopUsers(limit);
};
