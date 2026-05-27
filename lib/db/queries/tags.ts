import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TagType } from "@/lib/db/schema-types";

export async function createMediaTag(
  supabase: SupabaseClient<Database>,
  input: {
    albumId: string;
    mediaItemId: string;
    participantId: string;
    tagType: TagType;
    displayName: string;
    normalizedValue: string;
  }
) {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      album_id: input.albumId,
      media_item_id: input.mediaItemId,
      creator_participant_id: input.participantId,
      tag_type: input.tagType,
      display_name: input.displayName,
      normalized_value: input.normalizedValue
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeTag(
  supabase: SupabaseClient<Database>,
  tagId: string
) {
  const { error } = await supabase
    .from("tags")
    .update({ state: "removed", removed_at: new Date().toISOString() })
    .eq("id", tagId);

  if (error) {
    throw error;
  }
}
