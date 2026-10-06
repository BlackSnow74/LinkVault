import { z } from "zod";

export const createLinkSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  url: z.string().url("Must be a valid URL"),
  description: z.string().max(1000).optional(),
  collectionId: z.number().int().positive().nullable().optional(),
});

export const updateLinkSchema = createLinkSchema
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const linkQuerySchema = z.object({
  search: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
  collection: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const setTagsSchema = z.object({
  tagNames: z.array(z.string().min(1).max(50)).max(20),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type LinkQuery = z.infer<typeof linkQuerySchema>;
export type SetTagsInput = z.infer<typeof setTagsSchema>;
