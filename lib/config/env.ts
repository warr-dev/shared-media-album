import { z } from "zod";

const supabaseAdminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

const r2EnvSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET: z.string().min(1),
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: z.string().min(1).optional()
});

const envSchema = supabaseAdminEnvSchema.merge(r2EnvSchema).extend({
  APP_PUBLIC_URL: z.string().url().default("http://localhost:3000")
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}

export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

export function getSupabaseAdminEnv(
  source: NodeJS.ProcessEnv = process.env
): SupabaseAdminEnv {
  return supabaseAdminEnvSchema.parse(source);
}

export type R2Env = z.infer<typeof r2EnvSchema>;

export function getR2Env(source: NodeJS.ProcessEnv = process.env): R2Env {
  return r2EnvSchema.parse(source);
}

export function hasR2Env(source: NodeJS.ProcessEnv = process.env) {
  return Boolean(
    source.CLOUDFLARE_ACCOUNT_ID &&
      source.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      source.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      source.CLOUDFLARE_R2_BUCKET
  );
}

export function getPublicEnv(source?: NodeJS.ProcessEnv) {
  if (source) {
    return {
      supabaseUrl: source.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      appPublicUrl: source.APP_PUBLIC_URL ?? "http://localhost:3000"
    };
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appPublicUrl: process.env.APP_PUBLIC_URL ?? "http://localhost:3000"
  };
}

export function hasSupabaseEnv(source: NodeJS.ProcessEnv = process.env) {
  return Boolean(
    source.NEXT_PUBLIC_SUPABASE_URL &&
      source.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      source.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function hasSupabasePublicEnv(source?: NodeJS.ProcessEnv) {
  if (source) {
    return Boolean(source.NEXT_PUBLIC_SUPABASE_URL && source.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
