"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  whatsapp: string | null;
  wallet_balance: number;
  ref_code: string | null;
  role: string;
};
type Task = { id: number; platform: string; action: string; reward: number };
type Campaign = {
  id: number;
  platform: string;
  service_type: string;
  quantity: number;
  delivered: number;
  status: string;
};
type Txn = { id: number; amount: number; kind: string; note: string | null; created_at: string };

const TABS = ["Ringkasan", "Tugasan", "Kempen Saya", "Wallet", "Affiliate"] as const;
type Tab = (typeof TABS)[number];

const EMOJI: Record<string, string> = {
  TikTok: "🎵",
  Instagram: "📸",
  Facebook: "👍",
  YouTube: "▶️",
  Threads: "🧵",
  "Twitter / X": "𝕏",
};

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = hasSupabase ? createClient() : null;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/log-masuk";
      return;
    }
    const [p, t, c, w] = await Promise.all([
      supabase.from("profiles").select("full_name,whatsapp,wallet_balance,ref_code,role").eq("id", auth.user.id).single(),
      supabase.from("tasks").select("id,platform,action,reward").eq("status", "open").limit(30),
      supabase.from("campaigns").select("id,platform,service_type,quantity,delivered,status").eq("owner", auth.user.id).order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("id,amount,kind,note,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (p.data) setProfile(p.data as Profile);
    setTasks((t.data as Task[]) ?? []);
    setCampaigns((c.data as Campaign[]) ?? []);
    setTxns((w.data as Txn[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function doTask(task: Task) {
    if (!supabase) return;
    const proof = prompt(`Sahkan anda telah selesaikan: ${task.action}\nMasukkan username/bukti:`);
    if (!proof) return;
    const { error } = await supabase.rpc("submit_task", { p_task_id: task.id, p_proof: proof });
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Tugasan dihantar untuk semakan. Ganjaran " + rm(task.reward) + " selepas lulus.");
      load();
    }
  }

  async function topup() {
    if (!supabase) return;
    const v = prompt("Jumlah topup (RM):", "20");
    if (!v) return;
    const { error } = await supabase.rpc("topup_wallet", { p_amount: Number(v) });
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Wallet ditambah " + rm(Number(v)));
      load();
    }
  }

  async function withdraw() {
    if (!supabase) return;
    const v = prompt("Jumlah pengeluaran (RM):");
    if (!v) return;
    const method = prompt("Kaedah (cth: Maybank 1234... / TNG):", "Maybank");
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: Number(v), p_method: method });
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Permohonan pengeluaran dihantar.");
      load();
    }
  }

  const refLink =
    typeof window !== "undefined" && profile?.ref_code
      ? `${window.location.origin}/?ref=${profile.ref_code}`
      : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            {profile?.role === "admin" && (
              <Link href="/admin" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                Admin
              </Link>
            )}
            <span className="hidden text-sm text-slate-500 sm:block">
              Hai, {profile?.full_name ?? "Pengguna"} 👋
            </span>
            <button
              onClick={async () => {
                if (supabase) await supabase.auth.signOut();
                window.location.href = "/log-masuk";
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Log Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="py-24 text-center text-slate-400">Memuatkan…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-sm">
                <p className="text-sm text-brand-50">Baki Wallet</p>
                <p className="mt-1 text-3xl font-bold">{rm(profile?.wallet_balance ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Kempen Saya</p>
                <p className="mt-1 text-3xl font-bold">{campaigns.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Tugasan Tersedia</p>
                <p className="mt-1 text-3xl font-bold">{tasks.length}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
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
                  <h2 className="text-lg font-semibold">Selamat datang, {profile?.full_name} 🎉</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Buat tugasan untuk kumpul ganjaran, atau lancar kempen untuk naikkan engagement.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setTab("Tugasan")} className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
                      Buat Tugasan
                    </button>
                    <Link href="/marketplace" className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      Lancar Kempen
                    </Link>
                  </div>
                </div>
              )}

              {tab === "Tugasan" && (
                <div className="space-y-3">
                  {tasks.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">
                      Tiada tugasan tersedia buat masa ini. Semak semula nanti 🙌
                    </p>
                  )}
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                          {EMOJI[t.platform] ?? "⭐"}
                        </span>
                        <div>
                          <p className="font-semibold">{t.action}</p>
                          <p className="text-sm text-slate-500">{t.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-500">{rm(t.reward)}</span>
                        <button onClick={() => doTask(t)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                          Mula
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Kempen Saya" && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  {campaigns.length === 0 ? (
                    <p className="p-8 text-center text-slate-400">
                      Belum ada kempen.{" "}
                      <Link href="/marketplace" className="text-brand-500 hover:underline">
                        Lancar sekarang →
                      </Link>
                    </p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3">Platform</th>
                          <th className="px-4 py-3">Servis</th>
                          <th className="px-4 py-3">Progres</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => (
                          <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="px-4 py-3 font-medium">{c.platform}</td>
                            <td className="px-4 py-3">{c.service_type}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, (c.delivered / c.quantity) * 100)}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{c.delivered}/{c.quantity}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "completed" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === "Wallet" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm text-slate-500">Baki tersedia</p>
                    <p className="mt-1 text-3xl font-bold text-brand-500">{rm(profile?.wallet_balance ?? 0)}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={topup} className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">Topup</button>
                      <button onClick={withdraw} className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Withdraw</button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">Transaksi Terkini</p>
                    {txns.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-400">Tiada transaksi lagi.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {txns.map((x) => (
                          <li key={x.id} className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="text-slate-600 dark:text-slate-300">{x.note ?? x.kind}</span>
                            <span className={`font-semibold ${x.amount >= 0 ? "text-brand-500" : "text-rose-500"}`}>
                              {x.amount >= 0 ? "+" : ""}{rm(x.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {tab === "Affiliate" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-semibold">Program Affiliate</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Kongsi link anda &amp; dapat komisyen setiap rakan yang mendaftar &amp; membeli servis.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                    <code className="flex-1 truncate px-2 text-sm">{refLink || "—"}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(refLink);
                        flash("✅ Link disalin");
                      }}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Salin
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Kod rujukan anda: {profile?.ref_code}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
