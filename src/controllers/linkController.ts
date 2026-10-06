import { Request, Response } from "express";
import { linkService } from "../services/linkService";
import { AppError } from "../utils/AppError";
import {
  CreateLinkInput,
  UpdateLinkInput,
} from "../schemas/link.schema";

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
    const links = await linkService.getAll(getUserId(req));
    res.status(200).json(links);
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
