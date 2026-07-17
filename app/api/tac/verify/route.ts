import { NextResponse } from "next/server";
import { createAdminClient, normalizePhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { phone: rawPhone, code } = await req.json();
    const phone = normalizePhone(rawPhone || "");
    const inputCode = String(code || "").trim();

    const admin = createAdminClient();
    const { data: rec } = await admin
      .from("phone_verifications")
      .select("code,expires_at,verified,attempts")
      .eq("phone", phone)
      .maybeSingle();

    if (!rec) {
      return NextResponse.json({ ok: false, error: "Sila minta kod TAC dahulu." }, { status: 400 });
    }
    if (rec.verified) {
      return NextResponse.json({ ok: true, message: "Sudah disahkan." });
    }
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "Kod tamat tempoh. Minta kod baru." }, { status: 400 });
    }
    if ((rec.attempts ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "Terlalu banyak cubaan. Minta kod baru." }, { status: 429 });
    }

    if (rec.code !== inputCode) {
      await admin
        .from("phone_verifications")
        .update({ attempts: (rec.attempts ?? 0) + 1 })
        .eq("phone", phone);
      return NextResponse.json({ ok: false, error: "Kod TAC salah." }, { status: 400 });
    }

    await admin.from("phone_verifications").update({ verified: true }).eq("phone", phone);
    return NextResponse.json({ ok: true, message: "Nombor telefon disahkan." });
  } catch {
    return NextResponse.json({ ok: false, error: "Ralat tidak dijangka." }, { status: 500 });
  }
}
