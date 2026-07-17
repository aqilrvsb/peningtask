import { NextResponse } from "next/server";
import { createAdminClient, normalizePhone, validMyPhone } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s

export async function POST(req: Request) {
  try {
    const { phone: rawPhone } = await req.json();
    const phone = normalizePhone(rawPhone || "");
    if (!validMyPhone(phone)) {
      return NextResponse.json({ ok: false, error: "Nombor telefon tidak sah." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Phone must not already belong to a registered account
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("whatsapp", phone)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Nombor telefon ini sudah didaftarkan." },
        { status: 409 }
      );
    }

    // 2. Load SMS config first — no point storing an OTP we can't deliver
    const { data: secrets } = await admin
      .from("app_secrets")
      .select("key,value")
      .in("key", ["sms_app_key", "sms_app_secret", "sms_sender"]);
    const cfg: Record<string, string> = {};
    (secrets ?? []).forEach((r) => (cfg[r.key] = r.value ?? ""));
    if (!cfg.sms_app_key || !cfg.sms_app_secret) {
      return NextResponse.json(
        { ok: false, error: "Perkhidmatan SMS belum dikonfigurasi. Sila hubungi admin." },
        { status: 503 }
      );
    }

    // 3. Cooldown
    const { data: prev } = await admin
      .from("phone_verifications")
      .select("last_sent_at")
      .eq("phone", phone)
      .maybeSingle();
    if (prev?.last_sent_at) {
      const since = Date.now() - new Date(prev.last_sent_at).getTime();
      if (since < RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { ok: false, error: `Sila tunggu ${Math.ceil((RESEND_COOLDOWN_MS - since) / 1000)} saat sebelum minta kod baru.` },
          { status: 429 }
        );
      }
    }

    // 4. Generate + store OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error: upErr } = await admin.from("phone_verifications").upsert({
      phone,
      code,
      verified: false,
      attempts: 0,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      last_sent_at: new Date().toISOString(),
    });
    if (upErr) {
      return NextResponse.json({ ok: false, error: "Ralat pangkalan data." }, { status: 500 });
    }

    // 5. Send via 360 (Bulk360 v3.0)
    const text = `${code} ialah kod pengesahan (TAC) PeningJob anda. Sah selama 5 minit. Jangan kongsi kod ini.`;
    const url =
      `https://sms.360.my/gw/bulk360/v3_0/send.php?user=${encodeURIComponent(cfg.sms_app_key)}` +
      `&pass=${encodeURIComponent(cfg.sms_app_secret)}` +
      `&to=${phone}&from=${encodeURIComponent(cfg.sms_sender || "PeningJob")}` +
      `&text=${encodeURIComponent(text)}`;

    let providerCode = 0;
    let providerDesc = "";
    try {
      // Route through a static-IP proxy (QuotaGuard/Fixie) so 360 sees one
      // whitelistable IP. Set SMS_PROXY_URL in Vercel once you have the proxy.
      const fetchOpts: RequestInit & { dispatcher?: unknown } = {
        method: "GET",
        cache: "no-store",
      };
      const proxyUrl = process.env.SMS_PROXY_URL;
      if (proxyUrl) {
        const { ProxyAgent } = await import("undici");
        fetchOpts.dispatcher = new ProxyAgent(proxyUrl);
      }
      const res = await fetch(url, fetchOpts);
      const bodyText = await res.text();
      try {
        const j = JSON.parse(bodyText);
        providerCode = Number(j.code);
        providerDesc = j.desc ?? "";
      } catch {
        providerDesc = bodyText.slice(0, 140);
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Gagal menghubungi gerbang SMS." }, { status: 502 });
    }

    if (providerCode !== 200) {
      return NextResponse.json(
        { ok: false, error: `Gerbang SMS menolak (${providerCode || "?"}): ${providerDesc || "cuba lagi"}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "Kod TAC dihantar ke telefon anda." });
  } catch {
    return NextResponse.json({ ok: false, error: "Ralat tidak dijangka." }, { status: 500 });
  }
}
