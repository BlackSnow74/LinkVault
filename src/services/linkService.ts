import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { CreateLinkInput, UpdateLinkInput } from "../schemas/link.schema";

export const linkService = {
  async getAll(userId: number) {
    return prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: number, userId: number) {
    return prisma.link.findFirst({ where: { id, userId } });
  },

  async create(data: CreateLinkInput, userId: number) {
    return prisma.link.create({ data: { ...data, userId } });
  },

  async update(id: number, data: UpdateLinkInput, userId: number) {
    // findFirst first so a link owned by someone else returns 404, not a leak
    const owned = await prisma.link.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Link not found");
    return prisma.link.update({ where: { id }, data });
  },

  async remove(id: number, userId: number) {
    const owned = await prisma.link.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Link not found");
    return prisma.link.delete({ where: { id } });
  },
};
