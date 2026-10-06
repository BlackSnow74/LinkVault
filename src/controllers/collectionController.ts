import { Request, Response } from "express";
import { collectionService } from "../services/collectionService";
import { AppError } from "../utils/AppError";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../schemas/collection.schema";

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

export const collectionController = {
  async list(req: Request, res: Response) {
    res.status(200).json(await collectionService.getAll(getUserId(req)));
  },

  async getOne(req: Request, res: Response) {
    const c = await collectionService.getById(getId(req), getUserId(req));
    if (!c) throw new AppError(404, "Collection not found");
    res.status(200).json(c);
  },

  async create(req: Request, res: Response) {
    const c = await collectionService.create(
      req.body as CreateCollectionInput,
      getUserId(req),
    );
    res.status(201).json(c);
  },

  async update(req: Request, res: Response) {
    const c = await collectionService.update(
      getId(req),
      req.body as UpdateCollectionInput,
      getUserId(req),
    );
    res.status(200).json(c);
  },

  async remove(req: Request, res: Response) {
    await collectionService.remove(getId(req), getUserId(req));
    res.status(204).send();
  },
};
