import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventManagerStatus } from "@/lib/auth/event-manager";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/db/supabase-server";
import { relocateDevMedia } from "@/lib/dev/event-store";
import { errorResponse, forbidden, notFound } from "@/lib/http/errors";

const relocateMediaSchema = z.object({
  mode: z.enum(["move", "copy"]),
  targetAlbumId: z.string().uuid()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const input = relocateMediaSchema.parse(await request.json());

    if (!hasSupabaseEnv()) {
      const media = await relocateDevMedia(mediaId, input.targetAlbumId, input.mode);

      if (!media) {
        throw notFound("Media or target album not found.");
      }

      return NextResponse.json({ media });
    }

    const adminSupabase = createSupabaseAdminClient();
    const serverSupabase = await createSupabaseServerClient();
    const { data: media } = await adminSupabase
      .from("media_items")
      .select()
      .eq("id", mediaId)
      .maybeSingle();

    if (!media) {
      throw notFound("Media item not found.");
    }

    const { data: targetAlbum } = await adminSupabase
      .from("event_albums")
      .select("id,event_id")
      .eq("id", input.targetAlbumId)
      .maybeSingle();

    if (!targetAlbum || targetAlbum.event_id !== media.event_id) {
      throw notFound("Target album not found for this event.");
    }

    const managerStatus = await getEventManagerStatus(serverSupabase, media.event_id);

    if (!managerStatus.isManager) {
      throw forbidden("Only event managers can move or copy media.");
    }

    if (input.mode === "copy") {
      const { data: copiedMedia, error } = await adminSupabase
        .from("media_items")
        .insert({
          id: randomUUID(),
          album_id: targetAlbum.id,
          event_id: media.event_id,
          uploader_participant_id: media.uploader_participant_id,
          nickname_id: media.nickname_id,
          media_type: media.media_type,
          original_object_key: media.original_object_key,
          original_filename: media.original_filename,
          preview_data_url: media.preview_data_url,
          upload_status: media.upload_status,
          moderation_state: media.moderation_state,
          metadata_visibility: media.metadata_visibility
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ media: copiedMedia }, { status: 201 });
    }

    const { data: movedMedia, error } = await adminSupabase
      .from("media_items")
      .update({ album_id: targetAlbum.id })
      .eq("id", media.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { error: tagError } = await adminSupabase
      .from("tags")
      .update({ album_id: targetAlbum.id })
      .eq("media_item_id", media.id);

    if (tagError) {
      throw tagError;
    }

    await adminSupabase
      .from("event_albums")
      .update({ cover_media_id: null })
      .eq("id", media.album_id)
      .eq("cover_media_id", media.id);

    return NextResponse.json({ media: movedMedia });
  } catch (error) {
    return errorResponse(error);
  }
}
