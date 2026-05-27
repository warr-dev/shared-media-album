import { z } from "zod";

export const createTagSchema = z.object({
  tagType: z.enum(["text", "person"]),
  displayName: z.string().trim().min(1).max(80)
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
