import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, MediaType } from "@/lib/db/schema-types";

export type AlbumMediaListItem = Database["public"]["Tables"]["media_items"]["Row"] & {
  client_nicknames?: { display_name: string } | null;
};

export async function listAlbumMedia(
  supabase: SupabaseClient<Database>,
  albumId: string,
  tag?: string
) {
  let query = supabase
    .from("media_items")
    .select("*, client_nicknames(display_name)")
    .eq("album_id", albumId)
    .eq("upload_status", "uploaded")
    .eq("moderation_state", "visible")
    .order("uploaded_at", { ascending: false });

  if (tag) {
    query = query.eq("tags.normalized_value", tag);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as AlbumMediaListItem[];
}

export async function createMediaItem(
  supabase: SupabaseClient<Database>,
  input: {
    albumId: string;
    eventId: string;
    participantId: string;
    nicknameId?: string | null;
    mediaType: MediaType;
    objectKey: string;
    filename?: string | null;
    previewDataUrl?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("media_items")
    .insert({
      album_id: input.albumId,
      event_id: input.eventId,
      uploader_participant_id: input.participantId,
      nickname_id: input.nicknameId ?? null,
      media_type: input.mediaType,
      original_object_key: input.objectKey,
      original_filename: input.filename ?? null,
      preview_data_url: input.previewDataUrl ?? null,
      upload_status: "uploaded"
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
