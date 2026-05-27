import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/schema-types";

export const eventManagerRoles = ["organizer", "reviewer"] as const;

export type EventManagerRole = (typeof eventManagerRoles)[number];

export function isEventManagerRole(role: string | null | undefined): role is EventManagerRole {
  return role === "organizer" || role === "reviewer";
}

export type EventManagerStatus = {
  isManager: boolean;
  userId: string | null;
  role: EventManagerRole | "owner" | null;
};

export async function getEventManagerStatus(
  supabase: SupabaseClient<Database>,
  eventId: string
): Promise<EventManagerStatus> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { isManager: false, userId: null, role: null };
  }

  const { data: event } = await supabase
    .from("events")
    .select("owner_id")
    .eq("id", eventId)
    .maybeSingle();

  if (event?.owner_id === user.id) {
    return { isManager: true, userId: user.id, role: "owner" };
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("role")
    .eq("event_id", eventId)
    .eq("auth_user_id", user.id)
    .eq("access_state", "active")
    .in("role", [...eventManagerRoles])
    .maybeSingle();

  if (isEventManagerRole(participant?.role)) {
    return { isManager: true, userId: user.id, role: participant.role };
  }

  return { isManager: false, userId: user.id, role: null };
}
