import { z } from "zod";

export const eventTypeSchema = z.enum([
  "wedding",
  "birthday",
  "conference",
  "concert",
  "reunion",
  "party",
  "custom"
]);

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1).max(140),
    eventType: eventTypeSchema,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    albumTitle: z.string().trim().min(1).max(140),
    description: z.string().trim().max(2000).optional(),
    location: z.string().trim().max(240).optional(),
    visibilityEndsAt: z.string().datetime().optional()
  })
  .superRefine((value, ctx) => {
    if (value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End time must be after start time."
      });
    }
  });

export const createShareAccessSchema = z.object({
  permissions: z
    .array(z.enum(["view", "upload", "tag"]))
    .min(1)
    .default(["view", "upload", "tag"]),
  expiresAt: z.string().datetime().optional()
});

export const createAlbumSchema = z.object({
  title: z.string().trim().min(1).max(140)
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateShareAccessInput = z.infer<typeof createShareAccessSchema>;
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
