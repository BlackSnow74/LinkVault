import { prisma } from "../lib/prisma";
import { CreateLinkInput, UpdateLinkInput } from "../schemas/link.schema";

export const linkService = {
  async getAll() {
    return prisma.link.findMany({ orderBy: { createdAt: "desc" } });
  },

  async getById(id: number) {
    return prisma.link.findUnique({ where: { id } });
  },

  async create(data: CreateLinkInput) {
    return prisma.link.create({ data });
  },

  async update(id: number, data: UpdateLinkInput) {
    return prisma.link.update({ where: { id }, data });
  },

  async remove(id: number) {
    return prisma.link.delete({ where: { id } });
  },
};
