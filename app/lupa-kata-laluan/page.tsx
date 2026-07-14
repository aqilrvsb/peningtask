"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

export default function LupaKataLaluan() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/log-masuk`,
    });
    setLoading(false);
    setMsg(error ? error.message : "✅ Emel set semula dihantar. Sila semak inbox anda.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold">Lupa Kata Laluan</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Masukkan emel anda — kami akan hantar pautan set semula.
        </p>
        <form onSubmit={reset} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="Emel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <button disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {loading ? "Menghantar…" : "Hantar Pautan Set Semula"}
          </button>
        </form>
        {msg && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{msg}</p>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/log-masuk" className="font-semibold text-brand-500 hover:underline">← Kembali log masuk</Link>
        </p>
      </div>
    </div>
  );
}
