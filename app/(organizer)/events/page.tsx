import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { hasSupabasePublicEnv } from "@/lib/config/env";

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (hasSupabasePublicEnv() && !user) {
    redirect("/login?next=/events");
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Events</h1>
          <p className="mt-2 text-muted-foreground">Create albums and manage share access.</p>
        </div>
        <Link className="button-primary" href="/events/new">
          New event
        </Link>
      </div>
      <div className="rounded-md border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Event listing will connect to organizer data after the first creation flow is validated.
      </div>
    </section>
  );
}
