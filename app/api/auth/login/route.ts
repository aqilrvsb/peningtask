import { NextResponse } from "next/server";
import { createAdminClient, normalizePhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Resolve an email-or-phone identifier to an account email. The browser then
// signs in with that email + password (using the working client-side session).
export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    const id = String(identifier || "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "Emel/telefon diperlukan." }, { status: 400 });

    if (id.includes("@")) return NextResponse.json({ ok: true, email: id });

    // treat as phone → find the account's email
    const phone = normalizePhone(id);
    const admin = createAdminClient();
    const { data: prof } = await admin.from("profiles").select("id").eq("whatsapp", phone).maybeSingle();
    if (!prof) return NextResponse.json({ ok: false, error: "Emel/telefon atau kata laluan salah." }, { status: 400 });
    const { data: u } = await admin.auth.admin.getUserById(prof.id);
    if (!u?.user?.email) return NextResponse.json({ ok: false, error: "Emel/telefon atau kata laluan salah." }, { status: 400 });
    return NextResponse.json({ ok: true, email: u.user.email });
  } catch {
    return NextResponse.json({ ok: false, error: "Ralat tidak dijangka." }, { status: 500 });
  }
}
