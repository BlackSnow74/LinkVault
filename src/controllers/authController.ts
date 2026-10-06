import { Request, Response } from "express";
import { authService } from "../services/authService";
import { AppError } from "../utils/AppError";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body as RegisterInput);
    res.status(201).json(user);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response) {
    if (!req.userId) throw new AppError(401, "Unauthenticated");
    const user = await authService.me(req.userId);
    res.status(200).json(user);
  },
};
