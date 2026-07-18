"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!hasSupabase) {
      setMsg("Supabase belum disambung. Tetapkan env NEXT_PUBLIC_SUPABASE_URL & ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      // resolve email-or-phone → account email, then sign in client-side
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) });
      const j = await res.json();
      if (!j.ok || !j.email) { setLoading(false); setMsg(j.error || "Emel/telefon atau kata laluan salah."); return; }
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: j.email, password });
      if (error || !data.user) { setLoading(false); setMsg("Emel/telefon atau kata laluan salah."); return; }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const dest = prof?.role === "admin" ? "/admin" : prof?.role === "vendor" ? "/vendor" : "/dashboard";
      window.location.href = dest;
    } catch { setLoading(false); setMsg("Ralat rangkaian."); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold">Log Masuk</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Selamat kembali ke PeningJob 👋
        </p>

        <form onSubmit={loginEmail} className="mt-6 space-y-3">
          <input
            type="text"
            required
            placeholder="Emel atau No. Telefon"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="pj-input"
          />
          <input
            type="password"
            required
            placeholder="Kata laluan"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pj-input"
          />
          <div className="text-right">
            <Link href="/lupa-kata-laluan" className="text-sm text-brand-500 hover:underline">
              Lupa kata laluan?
            </Link>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? "Sila tunggu…" : "Log Masuk"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum ada akaun?{" "}
          <Link href="/daftar" className="font-semibold text-brand-500 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
