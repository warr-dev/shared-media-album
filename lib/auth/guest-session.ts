import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

const cookieName = "sma_guest_session";

export async function getOrCreateGuestSessionKey() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(cookieName)?.value;

  if (existing) {
    return existing;
  }

  const value = randomBytes(32).toString("base64url");
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return value;
}

export async function getGuestSessionKey() {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value ?? null;
}

export function hashGuestSessionKey(sessionKey: string) {
  return createHash("sha256").update(sessionKey).digest("hex");
}
