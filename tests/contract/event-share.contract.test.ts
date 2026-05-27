import { describe, expect, it } from "vitest";

import { createEventSchema, createShareAccessSchema } from "@/lib/validation/event";

describe("event/share API contracts", () => {
  it("validates POST /api/events request bodies", () => {
    expect(() =>
      createEventSchema.parse({
        name: "Community Meetup",
        eventType: "conference",
        startsAt: "2026-07-03T09:00:00.000Z",
        albumTitle: "Meetup Album"
      })
    ).not.toThrow();
  });

  it("validates POST /api/events/{eventId}/share request bodies", () => {
    expect(
      createShareAccessSchema.parse({
        permissions: ["view", "upload", "tag"]
      }).permissions
    ).toEqual(["view", "upload", "tag"]);
  });
});
