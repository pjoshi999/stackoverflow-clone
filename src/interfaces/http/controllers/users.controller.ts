import { Request, Response } from "express";
import { AuthRequest } from "../../../shared/types/types";
import * as getUserProfileService from "../../../core/users/use-cases/get-user-profile.service";
import * as getMyProfileService from "../../../core/users/use-cases/get-my-profile.service";
import * as getTopUsersService from "../../../core/users/use-cases/get-top-users.service";

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const profile = await getUserProfileService.getUserProfile(userId);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTop = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await getTopUsersService.getTopUsers(limit);
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await getMyProfileService.getMyProfile(req.userId!);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
