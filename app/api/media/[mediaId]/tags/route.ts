import { NextResponse } from "next/server";

import { getEventManagerStatus } from "@/lib/auth/event-manager";
import { getGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createMediaTag } from "@/lib/db/queries/tags";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/db/supabase-server";
import { errorResponse, forbidden, notFound } from "@/lib/http/errors";
import { createTagSchema } from "@/lib/validation/tag";

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 80);
}

async function getOrCreateManagerParticipant({
  albumId,
  eventId,
  userId
}: {
  albumId: string;
  eventId: string;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("participants")
    .select()
    .eq("album_id", albumId)
    .eq("auth_user_id", userId)
    .eq("access_state", "active")
    .in("role", ["organizer", "reviewer"])
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
      auth_user_id: userId,
      role: "organizer"
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const { mediaId } = await params;
    const input = createTagSchema.parse(await request.json());
    const adminSupabase = createSupabaseAdminClient();
    const serverSupabase = await createSupabaseServerClient();
    const { data: media } = await adminSupabase
      .from("media_items")
      .select("id,event_id,album_id,uploader_participant_id")
      .eq("id", mediaId)
      .maybeSingle();

    if (!media) {
      throw notFound("Media item not found.");
    }

    const managerStatus = await getEventManagerStatus(serverSupabase, media.event_id);
    let participantId: string | null = null;

    if (managerStatus.isManager && managerStatus.userId) {
      const managerParticipant = await getOrCreateManagerParticipant({
        albumId: media.album_id,
        eventId: media.event_id,
        userId: managerStatus.userId
      });
      participantId = managerParticipant.id;
    } else {
      const sessionKey = await getGuestSessionKey();
      const sessionKeyHash = sessionKey ? hashGuestSessionKey(sessionKey) : null;
      const { data: nickname } = sessionKeyHash
        ? await adminSupabase
            .from("client_nicknames")
            .select()
            .eq("album_id", media.album_id)
            .eq("session_key_hash", sessionKeyHash)
            .eq("state", "active")
            .maybeSingle()
        : { data: null };
      const { data: participant } = nickname
        ? await adminSupabase
            .from("participants")
            .select()
            .eq("album_id", media.album_id)
            .eq("client_nickname_id", nickname.id)
            .eq("access_state", "active")
            .maybeSingle()
        : { data: null };

      if (participant?.id === media.uploader_participant_id) {
        participantId = participant.id;
      }
    }

    if (!participantId) {
      throw forbidden("Only event managers or the uploader can tag this media.");
    }

    const tag = await createMediaTag(adminSupabase, {
      albumId: media.album_id,
      mediaItemId: media.id,
      participantId,
      tagType: input.tagType,
      displayName: input.displayName.trim(),
      normalizedValue: normalizeTag(input.displayName)
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
