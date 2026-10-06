import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.issues.map(
          (i) => `${i.path.join(".") || "body"}: ${i.message}`,
        ),
      });
      return;
    }
    req.body = result.data;
    next();
  };
