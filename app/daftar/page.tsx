"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Step = "form" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Step 1 -> request TAC
  async function requestTac(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!hasSupabase) {
      setErr("Sistem belum bersambung. Cuba sebentar lagi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tac/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await res.json();
      setLoading(false);
      if (!j.ok) {
        setErr(j.error || "Gagal menghantar kod.");
        return;
      }
      setMsg(`Kod TAC dihantar ke ${phone}.`);
      setStep("otp");
      setCooldown(60);
    } catch {
      setLoading(false);
      setErr("Ralat rangkaian. Cuba lagi.");
    }
  }

  async function resendTac() {
    if (cooldown > 0) return;
    setErr(null);
    const res = await fetch("/api/tac/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await res.json();
    if (!j.ok) setErr(j.error || "Gagal hantar semula.");
    else {
      setMsg("Kod baru dihantar.");
      setCooldown(60);
    }
  }

  // Step 2 -> verify TAC + create account
  async function verifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const vres = await fetch("/api/tac/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const vj = await vres.json().catch(() => ({ ok: false, error: "" }));
      if (!vj.ok) {
        setLoading(false);
        const e = typeof vj.error === "string" && vj.error.trim() && vj.error !== "{}" ? vj.error : "Kod TAC tidak sah atau tamat tempoh.";
        setErr(e);
        return;
      }

      const supabase = createClient();
      let ref = "";
      try {
        ref = localStorage.getItem("tk_ref") ?? "";
      } catch {}
      // phone is normalized server-side; send the same normalized value
      const normalized = phone.replace(/[^0-9]/g, "").replace(/^0/, "6");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            whatsapp: normalized.startsWith("60") ? normalized : "60" + normalized,
            ref,
            account_type: "user",
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      setLoading(false);
      if (error) {
        console.error("signUp error:", error);
        const raw = typeof error.message === "string" ? error.message.trim() : "";
        const lower = raw.toLowerCase();
        let friendly = raw && raw !== "{}" ? raw : "Pendaftaran gagal. Cuba lagi.";
        if (lower.includes("already") && (lower.includes("registered") || lower.includes("user")))
          friendly = "Emel ini sudah didaftarkan. Sila log masuk.";
        else if (lower.includes("email") && lower.includes("invalid"))
          friendly = "Format emel tidak sah.";
        else if (lower.includes("password"))
          friendly = "Kata laluan terlalu lemah (min. 6 aksara).";
        else if (lower.includes("database") || raw === "{}" || !raw)
          friendly = "Ralat semasa mencipta akaun. Sila cuba lagi.";
        setErr(friendly);
        return;
      }
      if (data.session) window.location.href = "/dashboard";
      else setMsg("Akaun berjaya dicipta! Sila log masuk.");
    } catch {
      setLoading(false);
      setErr("Ralat tidak dijangka. Cuba lagi.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="pj-card w-full max-w-md p-8 shadow-card">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight">Daftar Percuma</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {step === "form"
            ? "Mula buat tugasan & jana pendapatan sampingan."
            : "Masukkan kod 6-digit yang dihantar ke telefon anda."}
        </p>

        {/* step indicator */}
        <div className="mx-auto mt-5 flex max-w-[200px] items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step === "form" ? "bg-brand-gradient" : "bg-brand-500"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step === "otp" ? "bg-brand-gradient" : "bg-slate-200 dark:bg-white/10"}`} />
        </div>

        {step === "form" ? (
          <form onSubmit={requestTac} className="mt-6 space-y-3">
            <input required placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} className="pj-input" />
            <input type="email" required placeholder="Emel" value={email} onChange={(e) => setEmail(e.target.value)} className="pj-input" />
            <input
              type="tel"
              required
              inputMode="numeric"
              placeholder="No. Telefon (cth: 0123456789)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pj-input"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Kata laluan (min. 6 aksara)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pj-input"
            />
            <button disabled={loading} className="pj-btn-primary w-full py-3.5">
              {loading ? "Menghantar kod…" : "Hantar Kod TAC →"}
            </button>
            <p className="text-center text-xs text-slate-400">
              Kami akan hantar kod pengesahan (TAC) melalui SMS untuk sahkan nombor anda.
            </p>
          </form>
        ) : (
          <form onSubmit={verifyAndRegister} className="mt-6 space-y-4">
            <input
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="pj-input text-center text-2xl font-bold tracking-[0.5em]"
            />
            <button disabled={loading} className="pj-btn-primary w-full py-3.5">
              {loading ? "Mengesahkan…" : "Sahkan & Daftar"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep("form"); setErr(null); setMsg(null); setCode(""); }} className="text-slate-500 hover:underline">
                ← Tukar no. telefon
              </button>
              <button
                type="button"
                onClick={resendTac}
                disabled={cooldown > 0}
                className="font-semibold text-brand-600 disabled:text-slate-400 dark:text-brand-400"
              >
                {cooldown > 0 ? `Hantar semula (${cooldown}s)` : "Hantar semula kod"}
              </button>
            </div>
          </form>
        )}

        {msg && !err && (
          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-center text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {err}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah ada akaun?{" "}
          <Link href="/log-masuk" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Log masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
