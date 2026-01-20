import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../../shared/types/types";
import { jwtConfig } from "../../../config/env";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const decoded = jwt.verify(token, jwtConfig.secret) as {
      userId: number;
    };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
