import { NextResponse } from "next/server";
import { createAdminClient, normalizePhone, validMyPhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Admin-only: create a client or vendor account directly (no TAC needed —
// the phone is marked verified server-side).
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { data: prof } = await admin.from("profiles").select("role").eq("id", caller.user.id).single();
    if (prof?.role !== "admin") return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });

    const { name, email, phone: rawPhone, password, role } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ ok: false, error: "Name, email & password are required" }, { status: 400 });
    if (!["user", "vendor"].includes(role)) return NextResponse.json({ ok: false, error: "Role must be user or vendor" }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ ok: false, error: "Password min 6 characters" }, { status: 400 });

    let phone: string | null = null;
    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!validMyPhone(phone)) return NextResponse.json({ ok: false, error: "Invalid Malaysian phone number" }, { status: 400 });
      const { data: taken } = await admin.from("profiles").select("id").eq("whatsapp", phone).maybeSingle();
      if (taken) return NextResponse.json({ ok: false, error: "Phone number already registered" }, { status: 409 });
      // pre-verify so the signup trigger accepts it
      await admin.from("phone_verifications").upsert({
        phone, code: "000000", verified: true,
        expires_at: new Date(Date.now() + 60000).toISOString(),
      });
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, whatsapp: phone ?? undefined, account_type: role },
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    if (phone) await admin.from("phone_verifications").delete().eq("phone", phone);
    return NextResponse.json({ ok: true, id: created.user?.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
