import { describe, expect, it } from "vitest";

import { hasSupabaseEnv, hasSupabasePublicEnv } from "@/lib/config/env";

describe("Supabase env detection", () => {
  it("allows auth with only public Supabase env", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon"
    } as unknown as NodeJS.ProcessEnv;

    expect(hasSupabasePublicEnv(env)).toBe(true);
    expect(hasSupabaseEnv(env)).toBe(false);
  });
});
