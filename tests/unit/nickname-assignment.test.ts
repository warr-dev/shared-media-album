import { describe, expect, it } from "vitest";

import { buildNickname, buildNicknameSeed } from "@/lib/nicknames/assign";

describe("buildNickname", () => {
  it("creates stable, human-readable nicknames from numeric seeds", () => {
    expect(buildNickname(0)).toBe("Bright Guest 1");
    expect(buildNickname(10)).toBe("Bright Moment 1");
    expect(buildNickname(100)).toBe("Bright Guest 2");
  });

  it("creates stable numeric seeds from guest identity inputs", () => {
    expect(buildNicknameSeed("album-a:guest-a")).toBe(buildNicknameSeed("album-a:guest-a"));
    expect(buildNicknameSeed("album-a:guest-a")).not.toBe(buildNicknameSeed("album-a:guest-b"));
  });
});
