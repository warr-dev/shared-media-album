import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";
import { hasSupabasePublicEnv } from "@/lib/config/env";

export default async function HomePage() {
  const user = await getCurrentUser();
  const requiresAuth = hasSupabasePublicEnv();
  const canShowOrganizerLinks = !requiresAuth || Boolean(user);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Shared Media Album
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Private event albums guests can join from a QR link.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Create an event, share a revocable album link, and let guests add
          photos, videos, tags, and activity under assigned nicknames.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {canShowOrganizerLinks ? (
            <>
              <Link className="button-primary" href="/events/new">
                Create event
              </Link>
              <Link className="button-secondary" href="/events">
                View events
              </Link>
            </>
          ) : null}
          <Link className="button-secondary" href="/login">
            {user ? "Account" : "Sign in"}
          </Link>
        </div>
      </section>
    </main>
  );
}
