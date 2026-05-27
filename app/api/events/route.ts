import QRCode from "qrcode";
import { NextResponse } from "next/server";

import { OrganizerAuthError, requireOrganizer } from "@/lib/auth/organizer";
import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createEventWithAlbum } from "@/lib/db/queries/events";
import { createOrganizerParticipant } from "@/lib/db/queries/participants";
import { createShareAccess, createShareLink } from "@/lib/db/queries/share-access";
import { createDevEvent, toDevShareResponse } from "@/lib/dev/event-store";
import { errorResponse, unauthorized } from "@/lib/http/errors";
import { createEventSchema } from "@/lib/validation/event";

export async function POST(request: Request) {
  try {
    const input = createEventSchema.parse(await request.json());

    if (!hasSupabasePublicEnv()) {
      const { event, album, share } = await createDevEvent(input);
      const shareResponse = toDevShareResponse(share);

      return NextResponse.json(
        {
          eventId: event.id,
          albumId: album.id,
          share: {
            ...shareResponse,
            qrCodeUrl: await QRCode.toDataURL(shareResponse.link)
          }
        },
        { status: 201 }
      );
    }

    const { supabase, user } = await requireOrganizer();
    const { event, album } = await createEventWithAlbum(supabase, user.id, input);

    await createOrganizerParticipant(supabase, {
      eventId: event.id,
      albumId: album.id,
      authUserId: user.id
    });

    const share = await createShareAccess(supabase, {
      eventId: event.id,
      albumId: album.id,
      organizerId: user.id,
      input: { permissions: ["view", "upload", "tag"] }
    });
    const link = createShareLink(share.slug);

    return NextResponse.json(
      {
        eventId: event.id,
        albumId: album.id,
        share: {
          id: share.id,
          slug: share.slug,
          link,
          qrCodeUrl: await QRCode.toDataURL(link),
          state: share.state,
          permissions: share.permissions
        }
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
