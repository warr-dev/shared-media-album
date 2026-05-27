import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";
import type { CreateAlbumInput, CreateEventInput } from "@/lib/validation/event";
import { logAlbumActivity } from "@/lib/db/queries/album-activity";

export async function createEventWithAlbum(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  input: CreateEventInput
) {
  const eventId = randomUUID();
  const albumId = randomUUID();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      id: eventId,
      owner_id: ownerId,
      name: input.name,
      event_type: input.eventType,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      visibility_ends_at: input.visibilityEndsAt ?? null
    })
    .select()
    .single();

  if (eventError) {
    throw eventError;
  }

  const { data: album, error: albumError } = await supabase
    .from("event_albums")
    .insert({
      id: albumId,
      event_id: eventId,
      title: input.albumTitle
    })
    .select()
    .single();

  if (albumError) {
    throw albumError;
  }

  await logAlbumActivity(supabase, {
    event_id: event.id,
    album_id: album.id,
    activity_type: "event_created",
    subject_type: "event",
    subject_id: event.id
  });

  return { event, album };
}

export async function getEventWithAlbum(
  supabase: SupabaseClient<Database>,
  eventId: string
) {
  const { data, error } = await supabase
    .from("events")
    .select("*, event_albums(*)")
    .eq("id", eventId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEventAlbum(
  supabase: SupabaseClient<Database>,
  eventId: string,
  input: CreateAlbumInput
) {
  const { data, error } = await supabase
    .from("event_albums")
    .insert({
      event_id: eventId,
      title: input.title
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
