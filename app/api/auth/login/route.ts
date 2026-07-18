import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient, normalizePhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Login with EMAIL or PHONE. If the identifier isn't an email, resolve the phone
// to its account's email, then verify the password server-side and hand the
// browser a session to set.
export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    const id = String(identifier || "").trim();
    if (!id || !password) return NextResponse.json({ ok: false, error: "Emel/telefon & kata laluan diperlukan." }, { status: 400 });

    let email = id;
    if (!id.includes("@")) {
      // treat as phone → look up the account's email
      const phone = normalizePhone(id);
      const admin = createAdminClient();
      const { data: prof } = await admin.from("profiles").select("id").eq("whatsapp", phone).maybeSingle();
      if (!prof) return NextResponse.json({ ok: false, error: "Emel/telefon atau kata laluan salah." }, { status: 400 });
      const { data: u } = await admin.auth.admin.getUserById(prof.id);
      if (!u?.user?.email) return NextResponse.json({ ok: false, error: "Emel/telefon atau kata laluan salah." }, { status: 400 });
      email = u.user.email;
    }

    // verify credentials server-side with the anon client
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data.session) return NextResponse.json({ ok: false, error: "Emel/telefon atau kata laluan salah." }, { status: 400 });

    // role for post-login routing
    const admin = createAdminClient();
    const { data: prof } = await admin.from("profiles").select("role").eq("id", data.user!.id).single();

    return NextResponse.json({
      ok: true,
      role: prof?.role ?? "user",
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "DEBUG: " + String((e as Error)?.message || e) }, { status: 500 });
  }
}
