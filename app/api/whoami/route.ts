import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnostic: shows the current outbound (egress) IP of this serverless function.
// NOTE: On Vercel Hobby/Pro this IP is DYNAMIC and changes between invocations,
// so it cannot be reliably whitelisted at 360. Use a static-IP proxy for that.
export async function GET() {
  const out: Record<string, string> = {};
  const services = [
    ["ipify", "https://api.ipify.org?format=json"],
    ["ifconfig", "https://ifconfig.me/ip"],
  ] as const;
  for (const [name, url] of services) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const t = (await r.text()).trim();
      try {
        out[name] = JSON.parse(t).ip ?? t;
      } catch {
        out[name] = t;
      }
    } catch {
      out[name] = "error";
    }
  }
  return NextResponse.json({
    egress_ip: out.ipify || out.ifconfig,
    all: out,
    note: "IP Vercel adalah DINAMIK — berubah setiap kali. Jangan whitelist satu IP. Guna proksi IP statik (QuotaGuard/Fixie) atau minta 360 benarkan tanpa whitelist.",
  });
}
