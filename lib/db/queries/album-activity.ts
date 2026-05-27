import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";

export type ActivityInput =
  Database["public"]["Tables"]["album_activity"]["Insert"];

export async function logAlbumActivity(
  supabase: SupabaseClient<Database>,
  activity: ActivityInput
) {
  const { error } = await supabase.from("album_activity").insert(activity);

  if (error) {
    throw error;
  }
}
