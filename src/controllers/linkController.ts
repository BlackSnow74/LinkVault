import { Request, Response } from "express";
import { linkService } from "../services/linkService";
import { AppError } from "../utils/AppError";
import {
  CreateLinkInput,
  UpdateLinkInput,
  LinkQuery,
  SetTagsInput,
} from "../schemas/link.schema";
import { linkQuerySchema, setTagsSchema } from "../schemas/link.schema";

const getId = (req: Request): number => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid ID format");
  }
  return id;
};

const getUserId = (req: Request): number => {
  if (!req.userId) throw new AppError(401, "Unauthenticated");
  return req.userId;
};

export const linkController = {
  async list(req: Request, res: Response) {
    const parsed = linkQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "Invalid query parameters");
    }
    res.status(200).json(await linkService.getAll(getUserId(req), parsed.data));
  },

  async setTags(req: Request, res: Response) {
    const parsed = setTagsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "Body must be { tagNames: string[] }");
    }
    const link = await linkService.setTags(
      getId(req),
      getUserId(req),
      (parsed.data as SetTagsInput).tagNames,
    );
    res.status(200).json(link);
  },

  async getOne(req: Request, res: Response) {
    const link = await linkService.getById(getId(req), getUserId(req));
    if (!link) throw new AppError(404, "Link not found");
    res.status(200).json(link);
  },

  async create(req: Request, res: Response) {
    const link = await linkService.create(req.body as CreateLinkInput, getUserId(req));
    res.status(201).json(link);
  },

  async update(req: Request, res: Response) {
    const link = await linkService.update(
      getId(req),
      req.body as UpdateLinkInput,
      getUserId(req),
    );
    res.status(200).json(link);
  },

  async remove(req: Request, res: Response) {
    await linkService.remove(getId(req), getUserId(req));
    res.status(204).send();
  },
};
