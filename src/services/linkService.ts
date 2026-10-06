import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import {
  CreateLinkInput,
  UpdateLinkInput,
  LinkQuery,
} from "../schemas/link.schema";

const linkInclude = {
  tags: true,
  collection: { select: { id: true, name: true } },
} as const;

export const linkService = {
  async getAll(userId: number, query: LinkQuery) {
    const { search, tag, collection, page, limit } = query;

    const where = {
      userId,
      ...(collection ? { collectionId: collection } : {}),
      ...(tag ? { tags: { some: { name: tag } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { url: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.link.count({ where }),
      prisma.link.findMany({
        where,
        include: linkInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: number, userId: number) {
    return prisma.link.findFirst({ where: { id, userId }, include: linkInclude });
  },

  async create(data: CreateLinkInput, userId: number) {
    if (data.collectionId != null) {
      const owned = await prisma.collection.findFirst({
        where: { id: data.collectionId, userId },
      });
      if (!owned) throw new AppError(404, "Collection not found");
    }
    return prisma.link.create({ data: { ...data, userId }, include: linkInclude });
  },

  async update(id: number, data: UpdateLinkInput, userId: number) {
    const owned = await prisma.link.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Link not found");

    if (data.collectionId != null) {
      const collectionOwned = await prisma.collection.findFirst({
        where: { id: data.collectionId, userId },
      });
      if (!collectionOwned) throw new AppError(404, "Collection not found");
    }

    return prisma.link.update({ where: { id }, data, include: linkInclude });
  },

  async remove(id: number, userId: number) {
    const owned = await prisma.link.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Link not found");
    return prisma.link.delete({ where: { id } });
  },

  async setTags(id: number, userId: number, tagNames: string[]) {
    const owned = await prisma.link.findFirst({ where: { id, userId } });
    if (!owned) throw new AppError(404, "Link not found");

    const tags = await Promise.all(
      tagNames.map((name) =>
        prisma.tag.upsert({
          where: { name: name.toLowerCase().trim() },
          update: {},
          create: { name: name.toLowerCase().trim() },
        }),
      ),
    );

    return prisma.link.update({
      where: { id },
      data: { tags: { set: tags.map((t) => ({ id: t.id })) } },
      include: linkInclude,
    });
  },
};
