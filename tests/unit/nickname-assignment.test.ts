import { describe, expect, it } from "vitest";

import { buildNickname } from "@/lib/nicknames/assign";

describe("buildNickname", () => {
  it("creates stable, human-readable nicknames from numeric seeds", () => {
    expect(buildNickname(0)).toBe("Bright Guest 1");
    expect(buildNickname(10)).toBe("Bright Moment 1");
    expect(buildNickname(100)).toBe("Bright Guest 2");
  });
});
