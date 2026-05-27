import { describe, expect, it } from "vitest";

import { isEventManagerRole } from "@/lib/auth/event-manager";

describe("isEventManagerRole", () => {
  it("treats organizer and reviewer as event managers", () => {
    expect(isEventManagerRole("organizer")).toBe(true);
    expect(isEventManagerRole("reviewer")).toBe(true);
  });

  it("does not treat guests or missing roles as event managers", () => {
    expect(isEventManagerRole("guest")).toBe(false);
    expect(isEventManagerRole(null)).toBe(false);
    expect(isEventManagerRole(undefined)).toBe(false);
  });
});
