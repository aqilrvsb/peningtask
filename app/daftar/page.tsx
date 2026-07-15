"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"user" | "vendor">("user");
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
    let ref = "";
    try {
      ref = localStorage.getItem("tk_ref") ?? "";
    } catch {}
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, whatsapp, ref, account_type: accountType },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    // Bila email verification dimatikan, session terus wujud → masuk dashboard.
    if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setMsg("Akaun berjaya dicipta! Sila log masuk.");
    }
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

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={`rounded-xl border-2 p-3 text-left transition ${
              accountType === "user"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
            }`}
          >
            <p className="text-lg">💸</p>
            <p className="mt-1 text-sm font-bold">Buat Tugasan</p>
            <p className="text-xs text-slate-500">Jana pendapatan sampingan</p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("vendor")}
            className={`rounded-xl border-2 p-3 text-left transition ${
              accountType === "vendor"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
            }`}
          >
            <p className="text-lg">📣</p>
            <p className="mt-1 text-sm font-bold">Vendor / Bisnes</p>
            <p className="text-xs text-slate-500">Lancar kempen engagement</p>
          </button>
        </div>

        <form onSubmit={register} className="mt-4 space-y-3">
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
            type="tel"
            required
            inputMode="numeric"
            placeholder="No. WhatsApp (cth: 60123456789)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
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
