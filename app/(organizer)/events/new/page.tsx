import { redirect } from "next/navigation";

import { EventForm } from "@/components/event-form";
import { getCurrentUser } from "@/lib/auth/session";
import { hasSupabasePublicEnv } from "@/lib/config/env";

export default async function NewEventPage() {
  const user = await getCurrentUser();

  if (hasSupabasePublicEnv() && !user) {
    redirect("/login?next=/events/new");
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold">Create event</h1>
        <p className="mt-2 text-muted-foreground">
          Add event details first, then share the album QR link with guests.
        </p>
      </div>
      <EventForm />
    </section>
  );
}
