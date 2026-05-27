import { z } from "zod";

export const mediaTypeSchema = z.enum(["image", "video"]);

export const createUploadIntentSchema = z.object({
  albumId: z.string().uuid(),
  filename: z.string().trim().min(1).max(240),
  mediaType: mediaTypeSchema,
  byteSize: z.number().int().positive().max(1024 * 1024 * 500)
});

export const confirmMediaUploadSchema = z.object({
  uploadId: z.string().uuid(),
  objectKey: z.string().min(1).max(1024),
  mediaType: mediaTypeSchema
});

export type CreateUploadIntentInput = z.infer<typeof createUploadIntentSchema>;
export type ConfirmMediaUploadInput = z.infer<typeof confirmMediaUploadSchema>;
