import { NextResponse } from "next/server";

import { getOrCreateGuestSessionKey } from "@/lib/auth/guest-session";
import { hasR2Env, hasSupabaseEnv } from "@/lib/config/env";
import { createDevUploadIntent } from "@/lib/dev/event-store";
import { errorResponse } from "@/lib/http/errors";
import { createUploadIntent } from "@/lib/media/upload-intents";
import { createUploadIntentSchema } from "@/lib/validation/media";

export async function POST(request: Request) {
  try {
    const input = createUploadIntentSchema.parse(await request.json());
    await getOrCreateGuestSessionKey();

    if (!hasSupabaseEnv() || !hasR2Env()) {
      return NextResponse.json(await createDevUploadIntent(input), { status: 201 });
    }

    return NextResponse.json(await createUploadIntent(input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
