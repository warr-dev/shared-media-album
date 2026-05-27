import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/db/schema-types";
import { getPublicEnv } from "@/lib/config/env";

export function createSupabaseBrowserClient() {
  const env = getPublicEnv();

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
