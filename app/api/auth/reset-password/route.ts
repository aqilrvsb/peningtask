import { NextResponse } from "next/server";
import { createAdminClient, normalizePhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Phone + TAC password reset: verify the code for this phone, then set the new
// password for the account whose whatsapp matches.
export async function POST(req: Request) {
  try {
    const { phone: rawPhone, code, password } = await req.json();
    const phone = normalizePhone(rawPhone || "");
    const inputCode = String(code || "").trim();

    if (!phone) return NextResponse.json({ ok: false, error: "Nombor telefon diperlukan." }, { status: 400 });
    if (!inputCode) return NextResponse.json({ ok: false, error: "Kod TAC diperlukan." }, { status: 400 });
    if (String(password || "").length < 6) return NextResponse.json({ ok: false, error: "Kata laluan minimum 6 aksara." }, { status: 400 });

    const admin = createAdminClient();

    // 1) verify the TAC belongs to this phone and is still valid
    const { data: rec } = await admin
      .from("phone_verifications")
      .select("code,expires_at")
      .eq("phone", phone)
      .maybeSingle();
    if (!rec) return NextResponse.json({ ok: false, error: "Sila minta kod TAC dahulu." }, { status: 400 });
    if (new Date(rec.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: "Kod tamat tempoh. Minta kod baru." }, { status: 400 });
    if (rec.code !== inputCode) return NextResponse.json({ ok: false, error: "Kod TAC salah." }, { status: 400 });

    // 2) find the account by phone
    const { data: prof } = await admin.from("profiles").select("id").eq("whatsapp", phone).maybeSingle();
    if (!prof) return NextResponse.json({ ok: false, error: "Tiada akaun dengan nombor telefon ini." }, { status: 404 });

    // 3) set the new password
    const { error: upErr } = await admin.auth.admin.updateUserById(prof.id, { password });
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });

    // 4) consume the TAC so it can't be reused
    await admin.from("phone_verifications").delete().eq("phone", phone);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ralat tidak dijangka." }, { status: 500 });
  }
}
