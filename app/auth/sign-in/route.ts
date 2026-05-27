import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "password");
  const nextValue = String(formData.get("next") ?? "/events");
  const next = nextValue.startsWith("/") ? nextValue : "/events";

  if (!email) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Email is required.")}&next=${encodeURIComponent(next)}`, request.url),
      303
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (mode === "password") {
      if (!password) {
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent("Password is required.")}&next=${encodeURIComponent(next)}`,
            request.url
          ),
          303
        );
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return NextResponse.redirect(new URL(next, request.url), 303);
    }

    const origin = new URL(request.url).origin;
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    console.info("[auth/sign-in] sending magic link", {
      email,
      redirectTo: emailRedirectTo
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo
      }
    });

    if (error) {
      throw error;
    }

    console.info("[auth/sign-in] magic link accepted", { email });

    return NextResponse.redirect(
      new URL(`/login/sent?next=${encodeURIComponent(next)}`, request.url),
      303
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send sign-in link.";

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`, request.url),
      303
    );
  }
}
