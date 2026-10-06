import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

export const updateCollectionSchema = createCollectionSchema
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
