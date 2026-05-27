import Link from "next/link";

export default async function LoginSentPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const next = query.next?.startsWith("/") ? query.next : "/events";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 px-6 py-16">
        <div>
          <Link className="text-sm text-muted-foreground" href="/">
            Shared Media Album
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We sent a Supabase sign-in link. Open it in this browser to continue.
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          After signing in, you will continue to <span className="font-medium text-foreground">{next}</span>.
        </div>
        <Link className="button-secondary w-fit" href={`/login?next=${encodeURIComponent(next)}`}>
          Use a different email
        </Link>
      </section>
    </main>
  );
}
