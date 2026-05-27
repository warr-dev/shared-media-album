import { describe, expect, it } from "vitest";

import { createEventSchema } from "@/lib/validation/event";

describe("createEventSchema", () => {
  it("accepts the required event creation fields", () => {
    const parsed = createEventSchema.parse({
      name: "Maya and Ren Wedding",
      eventType: "wedding",
      startsAt: "2026-06-01T10:00:00.000Z",
      albumTitle: "Wedding Album"
    });

    expect(parsed.name).toBe("Maya and Ren Wedding");
  });

  it("rejects an end time before the start time", () => {
    const result = createEventSchema.safeParse({
      name: "Launch Party",
      eventType: "party",
      startsAt: "2026-06-01T10:00:00.000Z",
      endsAt: "2026-06-01T09:00:00.000Z",
      albumTitle: "Launch Album"
    });

    expect(result.success).toBe(false);
  });
});
