import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";

const adjectives = [
  "Bright",
  "Calm",
  "Golden",
  "Happy",
  "Kind",
  "Lively",
  "Lucky",
  "Merry",
  "Sunny",
  "Warm"
];

const nouns = [
  "Guest",
  "Moment",
  "Spark",
  "Star",
  "Smile",
  "Wave",
  "Frame",
  "Flash",
  "Echo",
  "Glow"
];

export function buildNickname(seed: number) {
  const adjective = adjectives[seed % adjectives.length];
  const noun = nouns[Math.floor(seed / adjectives.length) % nouns.length];
  const suffix = Math.floor(seed / (adjectives.length * nouns.length)) + 1;

  return `${adjective} ${noun} ${suffix}`;
}

export async function assignNicknameForAlbum(
  supabase: SupabaseClient<Database>,
  {
    eventId,
    albumId,
    sessionKeyHash
  }: {
    eventId: string;
    albumId: string;
    sessionKeyHash: string;
  }
) {
  const { data: existing, error: existingError } = await supabase
    .from("client_nicknames")
    .select()
    .eq("album_id", albumId)
    .eq("session_key_hash", sessionKeyHash)
    .eq("state", "active")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data: existingEventNickname, error: eventNicknameError } = await supabase
    .from("client_nicknames")
    .select("display_name")
    .eq("event_id", eventId)
    .eq("session_key_hash", sessionKeyHash)
    .eq("state", "active")
    .limit(1)
    .maybeSingle();

  if (eventNicknameError) {
    throw eventNicknameError;
  }

  for (let index = 0; index < 500; index += 1) {
    const displayName =
      existingEventNickname?.display_name && index === 0
        ? existingEventNickname.display_name
        : buildNickname(index);
    const { data, error } = await supabase
      .from("client_nicknames")
      .insert({
        event_id: eventId,
        album_id: albumId,
        display_name: displayName,
        session_key_hash: sessionKeyHash
      })
      .select()
      .single();

    if (!error && data) {
      return data;
    }

    if (error && error.code !== "23505") {
      throw error;
    }
  }

  throw new Error("Could not assign a unique nickname.");
}
