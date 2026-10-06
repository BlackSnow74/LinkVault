import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res.status(404).json({ error: "Route not found" });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
