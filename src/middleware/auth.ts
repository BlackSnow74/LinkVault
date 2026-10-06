import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";

declare module "express-serve-static-core" {
  interface Request {
    userId?: number;
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or malformed Authorization header");
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
};
