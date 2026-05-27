import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { hasSupabasePublicEnv } from "@/lib/config/env";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const isConfigured = hasSupabasePublicEnv();
  const next = query.next?.startsWith("/") ? query.next : "/events";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 px-6 py-16">
        <div>
          <Link className="text-sm text-muted-foreground" href="/">
            Shared Media Album
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-muted-foreground">
            Use Supabase Auth to manage event albums as an organizer.
          </p>
        </div>
        {query.error ? (
          <p className="rounded-md border border-destructive bg-card p-3 text-sm text-destructive">
            {query.error}
          </p>
        ) : null}
        {isConfigured ? (
          <LoginForm next={next} />
        ) : (
          <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
            to enable Supabase Auth.
          </div>
        )}
      </section>
    </main>
  );
}
