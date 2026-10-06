import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../schemas/collection.schema";

export const collectionService = {
  async getAll(userId: number) {
    return prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { links: true } } },
    });
  },

  async getById(id: number, userId?: number) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        links: {
          include: { tags: true, collection: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!collection) return null;
    // owner sees everything; everyone else only sees PUBLIC
    if (collection.userId !== userId && collection.visibility !== "PUBLIC") {
      return null; // 404, same as not existing — don't leak its existence
    }
    return collection;
  },

  async create(data: CreateCollectionInput, userId: number) {
    return prisma.collection.create({ data: { ...data, userId } });
  },

  async update(id: number, data: UpdateCollectionInput, userId: number) {
    const owned = await prisma.collection.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Collection not found");
    return prisma.collection.update({ where: { id }, data });
  },

  async remove(id: number, userId: number) {
    const owned = await prisma.collection.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Collection not found");
    // links.collectionId is SetNull on delete, so links survive
    return prisma.collection.delete({ where: { id } });
  },
};
