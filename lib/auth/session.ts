import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export async function getCurrentUser() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}
