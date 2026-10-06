import { z } from "zod";

export const createLinkSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  url: z.string().url("Must be a valid URL"),
  description: z.string().max(1000).optional(),
});

export const updateLinkSchema = createLinkSchema
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
