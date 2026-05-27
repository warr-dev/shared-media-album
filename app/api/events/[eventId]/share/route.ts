import QRCode from "qrcode";
import { NextResponse } from "next/server";

import { OrganizerAuthError, requireOrganizer } from "@/lib/auth/organizer";
import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createShareAccess, createShareLink } from "@/lib/db/queries/share-access";
import { createDevShareAccess, toDevShareResponse } from "@/lib/dev/event-store";
import { errorResponse, notFound, unauthorized } from "@/lib/http/errors";
import { createShareAccessSchema } from "@/lib/validation/event";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const input = createShareAccessSchema.parse(await request.json());

    if (!hasSupabasePublicEnv()) {
      const share = await createDevShareAccess(eventId, input);

      if (!share) {
        throw notFound("Event album not found.");
      }

      const shareResponse = toDevShareResponse(share);

      return NextResponse.json(
        {
          ...shareResponse,
          qrCodeUrl: await QRCode.toDataURL(shareResponse.link)
        },
        { status: 201 }
      );
    }

    const { supabase, user } = await requireOrganizer();
    const { data: album } = await supabase
      .from("event_albums")
      .select()
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!album) {
      throw notFound("Event album not found.");
    }

    const share = await createShareAccess(supabase, {
      eventId,
      albumId: album.id,
      organizerId: user.id,
      input
    });
    const link = createShareLink(share.slug);

    return NextResponse.json(
      {
        id: share.id,
        slug: share.slug,
        link,
        qrCodeUrl: await QRCode.toDataURL(link),
        state: share.state,
        permissions: share.permissions
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrganizerAuthError) {
      return errorResponse(unauthorized());
    }

    return errorResponse(error);
  }
}
