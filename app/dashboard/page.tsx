"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

const TABS = ["Ringkasan", "Tugasan Tersedia", "Kempen Saya", "Wallet", "Affiliate"] as const;
type Tab = (typeof TABS)[number];

const TASKS = [
  { id: 1, platform: "TikTok", emoji: "🎵", action: "Follow akaun", reward: "RM 0.08" },
  { id: 2, platform: "Instagram", emoji: "📸", action: "Like 3 post", reward: "RM 0.05" },
  { id: 3, platform: "YouTube", emoji: "▶️", action: "Subscribe channel", reward: "RM 0.12" },
  { id: 4, platform: "Facebook", emoji: "👍", action: "Like page", reward: "RM 0.10" },
  { id: 5, platform: "Threads", emoji: "🧵", action: "Follow & komen", reward: "RM 0.09" },
];

const CAMPAIGNS = [
  { id: 1, platform: "TikTok", target: "Followers", ordered: 500, done: 320, status: "Berjalan" },
  { id: 2, platform: "Instagram", target: "Likes", ordered: 1000, done: 1000, status: "Selesai" },
];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("Ringkasan");

  async function signOut() {
    if (hasSupabase) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    window.location.href = "/log-masuk";
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              Hai, Pengguna 👋
            </span>
            <button
              onClick={signOut}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Log Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Baki Wallet", value: "RM 12.40", accent: true },
            { label: "Tugasan Selesai", value: "38" },
            { label: "Jumlah Diperoleh", value: "RM 47.10" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border p-5 ${
                s.accent
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <p className={`text-sm ${s.accent ? "text-brand-50" : "text-slate-500"}`}>
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
                tab === t
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Ringkasan" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Selamat datang ke TugasKu</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Mulakan dengan menyelesaikan tugasan tersedia untuk kumpul ganjaran,
                atau lancarkan kempen untuk naikkan engagement akaun anda.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setTab("Tugasan Tersedia")}
                  className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600"
                >
                  Buat Tugasan
                </button>
                <Link
                  href="/marketplace"
                  className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Lancar Kempen
                </Link>
              </div>
            </div>
          )}

          {tab === "Tugasan Tersedia" && (
            <div className="space-y-3">
              {TASKS.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                      {t.emoji}
                    </span>
                    <div>
                      <p className="font-semibold">{t.action}</p>
                      <p className="text-sm text-slate-500">{t.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-500">{t.reward}</span>
                    <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                      Mula
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Kempen Saya" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Sasaran</th>
                    <th className="px-4 py-3">Progres</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGNS.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{c.platform}</td>
                      <td className="px-4 py-3">{c.target}</td>
                      <td className="px-4 py-3">
                        {c.done} / {c.ordered}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            c.status === "Selesai"
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Wallet" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Baki tersedia</p>
              <p className="mt-1 text-3xl font-bold text-brand-500">RM 12.40</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
                  Withdraw
                </button>
                <button className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Topup
                </button>
              </div>
            </div>
          )}

          {tab === "Affiliate" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Program Affiliate</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Kongsi link anda &amp; dapat komisyen setiap kali rakan mendaftar dan
                membeli servis.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                <code className="flex-1 truncate px-2 text-sm">
                  https://tugasku.app/?ref=USER123
                </code>
                <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                  Salin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
