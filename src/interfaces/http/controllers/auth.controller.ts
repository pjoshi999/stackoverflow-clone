import { Request, Response } from "express";
import * as registerUserService from "../../../core/auth/use-cases/register-user.service";
import * as loginUserService from "../../../core/auth/use-cases/login-user.service";
import * as sessionService from "../../../core/auth/use-cases/session.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUserService.registerUser({
      username,
      email,
      password,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const result = await sessionService.refreshSession(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
