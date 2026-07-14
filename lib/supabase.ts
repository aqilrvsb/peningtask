import { createBrowserClient } from "@supabase/ssr";

// Reads from env; safe to call even before env is set (returns a client that
// simply errors on network calls, so pages still render in local/preview).
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key-placeholder";
  return createBrowserClient(url, key);
}

export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
