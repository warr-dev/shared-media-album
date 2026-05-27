import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";

export async function createOrganizerParticipant(
  supabase: SupabaseClient<Database>,
  {
    eventId,
    albumId,
    authUserId
  }: {
    eventId: string;
    albumId: string;
    authUserId: string;
  }
) {
  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: eventId,
      album_id: albumId,
      auth_user_id: authUserId,
      role: "organizer"
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createGuestParticipant(
  supabase: SupabaseClient<Database>,
  {
    eventId,
    albumId,
    nicknameId
  }: {
    eventId: string;
    albumId: string;
    nicknameId: string;
  }
) {
  const { data: existing, error: existingError } = await supabase
    .from("participants")
    .select()
    .eq("album_id", albumId)
    .eq("client_nickname_id", nicknameId)
    .eq("access_state", "active")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: eventId,
      album_id: albumId,
      role: "guest",
      client_nickname_id: nicknameId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function revokeParticipant(
  supabase: SupabaseClient<Database>,
  participantId: string
) {
  const { error } = await supabase
    .from("participants")
    .update({ access_state: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", participantId);

  if (error) {
    throw error;
  }
}
