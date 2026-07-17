import { createClient } from "@supabase/supabase-js";

// Server-only. Never import this into a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "6" + p; // 012... -> 6012...
  if (!p.startsWith("60")) p = "60" + p.replace(/^60/, "");
  return p;
}

export function validMyPhone(p: string): boolean {
  // 60 + 9..11 digits
  return /^60\d{8,11}$/.test(p);
}
