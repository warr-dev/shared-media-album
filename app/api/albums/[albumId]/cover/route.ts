import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventManagerStatus } from "@/lib/auth/event-manager";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/db/supabase-server";
import { setDevAlbumCover } from "@/lib/dev/event-store";
import { errorResponse, forbidden, notFound } from "@/lib/http/errors";

const setAlbumCoverSchema = z.object({
  mediaId: z.string().uuid()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    const input = setAlbumCoverSchema.parse(await request.json());

    if (!hasSupabaseEnv()) {
      const album = await setDevAlbumCover(albumId, input.mediaId);

      if (!album) {
        throw notFound("Album media not found.");
      }

      return NextResponse.json({ album });
    }

    const adminSupabase = createSupabaseAdminClient();
    const serverSupabase = await createSupabaseServerClient();
    const { data: album } = await adminSupabase
      .from("event_albums")
      .select("id,event_id")
      .eq("id", albumId)
      .maybeSingle();

    if (!album) {
      throw notFound("Album not found.");
    }

    const managerStatus = await getEventManagerStatus(serverSupabase, album.event_id);

    if (!managerStatus.isManager) {
      throw forbidden("Only event managers can set album covers.");
    }

    const { data: media } = await adminSupabase
      .from("media_items")
      .select("id")
      .eq("id", input.mediaId)
      .eq("album_id", albumId)
      .eq("upload_status", "uploaded")
      .eq("moderation_state", "visible")
      .maybeSingle();

    if (!media) {
      throw notFound("Album media not found.");
    }

    const { data: updatedAlbum, error } = await adminSupabase
      .from("event_albums")
      .update({ cover_media_id: media.id })
      .eq("id", albumId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ album: updatedAlbum });
  } catch (error) {
    return errorResponse(error);
  }
}
