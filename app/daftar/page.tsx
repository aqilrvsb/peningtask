"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!hasSupabase) {
      setMsg("Supabase belum disambung. Tetapkan env dahulu untuk aktifkan pendaftaran.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) setMsg(error.message);
    else setMsg("Berjaya! Semak emel anda untuk pengesahan.");
  }

  async function googleSignup() {
    if (!hasSupabase) {
      setMsg("Supabase belum disambung. Google akan aktif selepas env & OAuth ditetapkan.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold">Daftar Percuma</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Mula buat tugasan atau naikkan sosial anda hari ini.
        </p>

        <button
          onClick={googleSignup}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <span className="text-lg">🔵</span> Daftar dengan Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          ATAU
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <form onSubmit={register} className="space-y-3">
          <input
            required
            placeholder="Nama penuh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="email"
            required
            placeholder="Emel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Kata laluan (min. 6 aksara)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? "Sila tunggu…" : "Daftar Akaun"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah ada akaun?{" "}
          <Link href="/log-masuk" className="font-semibold text-brand-500 hover:underline">
            Log masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
