import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";

export async function AuthNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link className="button-secondary h-9" href="/login">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline">
        {user.email}
      </span>
      <form action="/auth/sign-out" method="post">
        <button className="button-secondary h-9" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
