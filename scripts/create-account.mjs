#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args.set(key, true);
      continue;
    }

    args.set(key, next);
    index += 1;
  }

  return args;
}

function usage() {
  console.log(`
Usage:
  npm run account:create -- --email organizer@example.com
  npm run account:create -- --email organizer@example.com --password "change-me"

Options:
  --email       Required. Account email address.
  --password    Optional. Creates a confirmed password account instead of sending an invite.
  --name        Optional. Stored in user metadata.

Requires:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = readArgs(process.argv.slice(2));
const email = args.get("email");
const password = args.get("password");
const name = args.get("name");

if (args.has("help")) {
  usage();
  process.exit(0);
}

if (!email) {
  usage();
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Add both to .env.local before running this script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const metadata = {
  internal_role: "organizer",
  display_name: typeof name === "string" ? name : undefined
};

const result =
  typeof password === "string"
    ? await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata
      })
    : await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          ...metadata,
          invite_id: randomUUID()
        }
      });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

console.log(password ? "Account created." : "Invite sent.");
console.log(`Email: ${email}`);
console.log(`User ID: ${result.data.user?.id ?? "pending invite"}`);
