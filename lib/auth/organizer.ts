import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export class OrganizerAuthError extends Error {
  constructor(message = "Organizer authentication is required.") {
    super(message);
    this.name = "OrganizerAuthError";
  }
}

export async function requireOrganizer() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new OrganizerAuthError();
  }

  return { supabase, user };
}
