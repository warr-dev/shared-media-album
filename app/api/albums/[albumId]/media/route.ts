import { NextResponse } from "next/server";
import { z } from "zod";

import { getGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createMediaItem, listAlbumMedia } from "@/lib/db/queries/media";
import { createGuestParticipant } from "@/lib/db/queries/participants";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { confirmDevMediaUpload, listDevAlbumMedia } from "@/lib/dev/event-store";
import { errorResponse, forbidden, notFound } from "@/lib/http/errors";
import { assignNicknameForAlbum } from "@/lib/nicknames/assign";
import { confirmMediaUploadSchema } from "@/lib/validation/media";

const confirmDevMediaUploadSchema = confirmMediaUploadSchema.extend({
  filename: z.string().min(1).max(240).optional(),
  previewDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(8 * 1024 * 1024)
    .nullable()
    .optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ items: await listDevAlbumMedia(albumId) });
    }

    const supabase = createSupabaseAdminClient();
    return NextResponse.json({ items: await listAlbumMedia(supabase, albumId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    const input = confirmDevMediaUploadSchema.parse(await request.json());

    if (!hasSupabaseEnv()) {
      const sessionKey = await getGuestSessionKey();

      if (!sessionKey) {
        throw forbidden("Join the album before uploading.");
      }

      const media = await confirmDevMediaUpload({
        albumId,
        objectKey: input.objectKey,
        mediaType: input.mediaType,
        filename: input.filename ?? input.objectKey,
        previewDataUrl: input.previewDataUrl,
        sessionKeyHash: hashGuestSessionKey(sessionKey)
      });

      if (!media) {
        throw notFound("Album or participant was not found.");
      }

      return NextResponse.json(media, { status: 201 });
    }

    const sessionKey = await getGuestSessionKey();

    if (!sessionKey) {
      throw forbidden("Join the album before uploading.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: album } = await supabase
      .from("event_albums")
      .select()
      .eq("id", albumId)
      .single();

    if (!album) {
      throw notFound("Album was not found.");
    }

    let { data: nickname } = await supabase
      .from("client_nicknames")
      .select()
      .eq("album_id", albumId)
      .eq("session_key_hash", hashGuestSessionKey(sessionKey))
      .eq("state", "active")
      .maybeSingle();

    if (!nickname) {
      nickname = await assignNicknameForAlbum(supabase, {
        eventId: album.event_id,
        albumId,
        sessionKeyHash: hashGuestSessionKey(sessionKey)
      });
    }

    let { data: participant } = await supabase
      .from("participants")
      .select()
      .eq("album_id", albumId)
      .eq("client_nickname_id", nickname.id)
      .eq("access_state", "active")
      .maybeSingle();

    if (!participant) {
      participant = await createGuestParticipant(supabase, {
        eventId: album.event_id,
        albumId,
        nicknameId: nickname.id
      });
    }

    const media = await createMediaItem(supabase, {
      albumId,
      eventId: album.event_id,
      participantId: participant.id,
      nicknameId: nickname.id,
      mediaType: input.mediaType,
      objectKey: input.previewDataUrl ?? input.objectKey,
      filename: input.filename,
      previewDataUrl: input.previewDataUrl
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
