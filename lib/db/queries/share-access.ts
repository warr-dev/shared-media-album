import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";
import type { CreateShareAccessInput } from "@/lib/validation/event";
import { getPublicEnv } from "@/lib/config/env";
import { logAlbumActivity } from "@/lib/db/queries/album-activity";

export function createShareSlug() {
  return randomBytes(9).toString("base64url");
}

export function createShareLink(slug: string) {
  return `${getPublicEnv().appPublicUrl}/a/${slug}`;
}

export async function createShareAccess(
  supabase: SupabaseClient<Database>,
  {
    eventId,
    albumId,
    organizerId,
    input
  }: {
    eventId: string;
    albumId: string;
    organizerId: string;
    input: CreateShareAccessInput;
  }
) {
  const { data, error } = await supabase
    .from("share_access")
    .insert({
      event_id: eventId,
      album_id: albumId,
      slug: createShareSlug(),
      permissions: input.permissions,
      created_by: organizerId,
      expires_at: input.expiresAt ?? null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await logAlbumActivity(supabase, {
    event_id: eventId,
    album_id: albumId,
    activity_type: "share_created",
    subject_type: "share_access",
    subject_id: data.id
  });

  return data;
}

export async function findActiveShareAccess(
  supabase: SupabaseClient<Database>,
  slug: string
) {
  const { data, error } = await supabase
    .from("share_access")
    .select()
    .eq("slug", slug)
    .eq("state", "active")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
