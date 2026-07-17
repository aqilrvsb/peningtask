import { createClient } from "@supabase/supabase-js";

// Server-only. Never import this into a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Re-export the shared normalizer so client + server stay identical.
export { normalizePhone, validMyPhone } from "./phone";
