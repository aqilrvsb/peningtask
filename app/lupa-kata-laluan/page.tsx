"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site";

export default function LupaKataLaluan() {
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendTac(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null); setLoading(true);
    try {
      const res = await fetch("/api/tac/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json(); setLoading(false);
      if (!j.ok) return setErr(j.error || "Gagal menghantar kod.");
      setMsg(`Kod TAC dihantar ke ${phone}.`); setStep("reset"); setCooldown(60);
    } catch { setLoading(false); setErr("Ralat rangkaian."); }
  }

  async function resend() {
    if (cooldown > 0) return; setErr(null);
    const res = await fetch("/api/tac/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const j = await res.json();
    if (!j.ok) setErr(j.error); else { setMsg("Kod baru dihantar."); setCooldown(60); }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code, password }) });
      const j = await res.json(); setLoading(false);
      if (!j.ok) return setErr(j.error || "Gagal menetapkan kata laluan.");
      setMsg("✅ Kata laluan berjaya ditukar! Mengalihkan ke log masuk…");
      setTimeout(() => { window.location.href = "/log-masuk"; }, 1500);
    } catch { setLoading(false); setErr("Ralat rangkaian."); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-center text-2xl font-bold">Lupa Kata Laluan</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {step === "phone" ? "Masukkan nombor telefon anda — kami akan hantar kod TAC." : "Masukkan kod TAC & kata laluan baru anda."}
        </p>

        {step === "phone" ? (
          <form onSubmit={sendTac} className="mt-6 space-y-3">
            <input type="tel" required inputMode="numeric" placeholder="Nombor telefon (cth: 0123456789)" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" />
            <button disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {loading ? "Menghantar…" : "Hantar Kod TAC →"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-6 space-y-3">
            <input inputMode="numeric" maxLength={6} required placeholder="_ _ _ _ _ _" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" />
            <input type="password" required minLength={6} placeholder="Kata laluan baru (min. 6)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" />
            <button disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {loading ? "Menyimpan…" : "Tukar Kata Laluan"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep("phone"); setErr(null); setCode(""); }} className="text-slate-500 hover:underline">← Tukar nombor</button>
              <button type="button" onClick={resend} disabled={cooldown > 0} className="font-semibold text-brand-600 disabled:text-slate-400 dark:text-brand-400">{cooldown > 0 ? `Hantar semula (${cooldown}s)` : "Hantar semula kod"}</button>
            </div>
          </form>
        )}

        {msg && !err && <p className="mt-4 rounded-lg bg-brand-50 p-3 text-center text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{msg}</p>}
        {err && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-center text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{err}</p>}
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/log-masuk" className="font-semibold text-brand-500 hover:underline">← Kembali log masuk</Link>
        </p>
      </div>
    </div>
  );
}
