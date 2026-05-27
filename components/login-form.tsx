import { Mail } from "lucide-react";

export function LoginForm({ next = "/events" }: { next?: string }) {
  return (
    <form action="/auth/sign-in" className="grid gap-4" method="post">
      <input name="next" type="hidden" value={next} />
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          autoComplete="email"
          className="rounded-md border border-input bg-card px-3 py-2"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          autoComplete="current-password"
          className="rounded-md border border-input bg-card px-3 py-2"
          name="password"
          type="password"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="button-primary w-fit" name="mode" type="submit" value="password">
          Sign in
        </button>
        <button
          className="button-secondary w-fit gap-2"
          name="mode"
          type="submit"
          value="magic-link"
        >
          <Mail className="h-4 w-4" />
          Send magic link
        </button>
      </div>
    </form>
  );
}
