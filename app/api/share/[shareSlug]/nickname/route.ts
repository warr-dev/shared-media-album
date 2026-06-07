import { NextResponse } from "next/server";

import { getGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv, hasSupabasePublicEnv } from "@/lib/config/env";
import { findActiveShareAccess } from "@/lib/db/queries/share-access";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { updateDevNickname } from "@/lib/dev/event-store";
import { errorResponse, notFound, unauthorized } from "@/lib/http/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  try {
    const { shareSlug } = await params;
    const sessionKey = await getGuestSessionKey();

    if (!sessionKey) {
      throw unauthorized("No guest session found.");
    }

    const { nickname } = (await request.json().catch(() => ({}))) as { nickname?: string };

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: "Nickname is required" }, { status: 400 });
    }

    const trimmedNickname = nickname.trim().slice(0, 50);
    const sessionKeyHash = hashGuestSessionKey(sessionKey);

    if (!hasSupabasePublicEnv()) {
      const updated = await updateDevNickname(shareSlug, sessionKeyHash, trimmedNickname);

      if (!updated) {
        throw notFound("Share link is unavailable.");
      }

      return NextResponse.json({ success: true, nickname: trimmedNickname });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase connection is not configured." },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const share = await findActiveShareAccess(supabase, shareSlug).catch(() => null);

    if (!share) {
      throw notFound("Share link is unavailable.");
    }

    // Update guest's display name across all albums in the same event
    const { error } = await supabase
      .from("client_nicknames")
      .update({ display_name: trimmedNickname })
      .eq("event_id", share.event_id)
      .eq("session_key_hash", sessionKeyHash)
      .eq("state", "active");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, nickname: trimmedNickname });
  } catch (error) {
    return errorResponse(error);
  }
}
