import { NextResponse } from "next/server";

import { getOrCreateGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv, hasSupabasePublicEnv } from "@/lib/config/env";
import { logAlbumActivity } from "@/lib/db/queries/album-activity";
import { createGuestParticipant } from "@/lib/db/queries/participants";
import { findActiveShareAccess } from "@/lib/db/queries/share-access";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { joinDevShare } from "@/lib/dev/event-store";
import { errorResponse, notFound } from "@/lib/http/errors";
import { assignNicknameForAlbum } from "@/lib/nicknames/assign";

function wantsHtmlRedirect(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";

  return accept.includes("text/html") || contentType.includes("application/x-www-form-urlencoded");
}

function joinResponse(request: Request, shareSlug: string, body: unknown) {
  if (wantsHtmlRedirect(request)) {
    return NextResponse.redirect(new URL(`/a/${shareSlug}?joined=1`, request.url), 303);
  }

  return NextResponse.json(body);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  try {
    const { shareSlug } = await params;
    const sessionKey = await getOrCreateGuestSessionKey();

    if (!hasSupabasePublicEnv()) {
      const joined = await joinDevShare(shareSlug, hashGuestSessionKey(sessionKey));

      if (!joined) {
        throw notFound("Share link is unavailable.");
      }

      return joinResponse(request, shareSlug, joined);
    }

    if (!hasSupabaseEnv()) {
      if (wantsHtmlRedirect(request)) {
        return NextResponse.redirect(
          new URL(`/a/${shareSlug}?error=join-not-configured`, request.url),
          303
        );
      }

      return NextResponse.json(
        { error: "Guest join requires SUPABASE_SERVICE_ROLE_KEY when Supabase is configured." },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const share = await findActiveShareAccess(supabase, shareSlug).catch(() => null);

    if (!share) {
      throw notFound("Share link is unavailable.");
    }

    const nickname = await assignNicknameForAlbum(supabase, {
      eventId: share.event_id,
      albumId: share.album_id,
      sessionKeyHash: hashGuestSessionKey(sessionKey)
    });
    const participant = await createGuestParticipant(supabase, {
      eventId: share.event_id,
      albumId: share.album_id,
      nicknameId: nickname.id
    });

    await logAlbumActivity(supabase, {
      event_id: share.event_id,
      album_id: share.album_id,
      actor_participant_id: participant.id,
      nickname_id: nickname.id,
      activity_type: "nickname_assigned",
      subject_type: "participant",
      subject_id: participant.id
    });

    return joinResponse(request, shareSlug, {
      eventId: share.event_id,
      albumId: share.album_id,
      participantId: participant.id,
      nickname: nickname.display_name
    });
  } catch (error) {
    return errorResponse(error);
  }
}
