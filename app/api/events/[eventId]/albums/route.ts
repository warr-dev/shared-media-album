import { NextResponse } from "next/server";

import { getEventManagerStatus } from "@/lib/auth/event-manager";
import { OrganizerAuthError, requireOrganizer } from "@/lib/auth/organizer";
import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createEventAlbum } from "@/lib/db/queries/events";
import { createDevAlbum } from "@/lib/dev/event-store";
import { errorResponse, forbidden, notFound, unauthorized } from "@/lib/http/errors";
import { createAlbumSchema } from "@/lib/validation/event";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const input = createAlbumSchema.parse(await request.json());

    if (!hasSupabasePublicEnv()) {
      const album = await createDevAlbum(eventId, input.title);

      if (!album) {
        throw notFound("Event not found.");
      }

      return NextResponse.json({ album }, { status: 201 });
    }

    const { supabase } = await requireOrganizer();
    const managerStatus = await getEventManagerStatus(supabase, eventId);

    if (!managerStatus.isManager) {
      throw forbidden("Only event managers can create albums.");
    }

    const album = await createEventAlbum(supabase, eventId, input);

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizerAuthError) {
      return errorResponse(unauthorized());
    }

    return errorResponse(error);
  }
}
