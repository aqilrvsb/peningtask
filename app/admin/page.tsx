"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Stats = {
  users: number;
  campaigns: number;
  open_tasks: number;
  pending_subs: number;
  pending_withdrawals: number;
  wallet_total: number;
};
type Sub = { id: number; task_id: number; user_id: string; proof: string | null; proof_url: string | null; status: string; created_at: string };
type Wd = { id: number; user_id: string; amount: number; method: string | null; status: string; created_at: string };
type User = { id: string; full_name: string | null; whatsapp: string | null; wallet_balance: number; role: string };

const TABS = ["Ringkasan", "Cipta Tugasan", "Submissions", "Pengeluaran", "Pengguna"] as const;
type Tab = (typeof TABS)[number];

const PLATFORMS = ["Facebook", "Threads", "TikTok", "Instagram", "AI"];
const AI_ACTIONS = ["Create Video AI", "Generate Gambar AI", "Tulis Caption AI"];

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

export default function Admin() {
  const supabase = hasSupabase ? createClient() : null;
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [stats, setStats] = useState<Stats | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // create-task form
  const [platform, setPlatform] = useState("Facebook");
  const [action, setAction] = useState("Follow akaun");
  const [reward, setReward] = useState(0.1);
  const [count, setCount] = useState(50);
  const [targetUrl, setTargetUrl] = useState("");
  const [proofTypes, setProofTypes] = useState<string[]>(["image"]);
  const [busy, setBusy] = useState(false);

  const toggleProof = (p: string) =>
    setProofTypes((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/log-masuk";
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
    if (prof?.role !== "admin") {
      setOk(false);
      return;
    }
    setOk(true);
    const [st, sb, wd, us] = await Promise.all([
      supabase.rpc("admin_stats"),
      supabase.from("submissions").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("status", "requested").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,whatsapp,wallet_balance,role").order("created_at", { ascending: false }).limit(100),
    ]);
    setStats((st.data as Stats) ?? null);
    setSubs((sb.data as Sub[]) ?? []);
    setWds((wd.data as Wd[]) ?? []);
    setUsers((us.data as User[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTasks() {
    if (!supabase) return;
    if (proofTypes.length === 0) {
      flash("⚠️ Pilih sekurang-kurangnya satu jenis bukti");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("admin_create_tasks", {
      p_platform: platform,
      p_service_type: platform === "AI" ? "AI Task" : "Engagement",
      p_action: action,
      p_reward: reward,
      p_count: count,
      p_proof_types: proofTypes,
      p_target_url: targetUrl || null,
    });
    setBusy(false);
    if (error) flash("❌ " + error.message);
    else {
      flash(`✅ ${count} tugasan "${action}" dicipta`);
      load();
    }
  }

  async function approve(id: number) {
    if (!supabase) return;
    const { error } = await supabase.rpc("approve_submission", { p_sub_id: id });
    flash(error ? "❌ " + error.message : "✅ Diluluskan, wallet dikreditkan");
    load();
  }
  async function reject(id: number) {
    if (!supabase) return;
    const { error } = await supabase.rpc("reject_submission", { p_sub_id: id });
    flash(error ? "❌ " + error.message : "↩️ Ditolak, tugasan dibuka semula");
    load();
  }
  async function processWd(id: number, approve: boolean) {
    if (!supabase) return;
    const { error } = await supabase.rpc("process_withdrawal", { p_id: id, p_approve: approve });
    flash(error ? "❌ " + error.message : approve ? "✅ Pengeluaran dibayar" : "↩️ Ditolak & direfund");
    load();
  }

  if (ok === false)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <p className="text-lg font-semibold">Akses ditolak 🔒</p>
          <p className="mt-1 text-slate-500">Halaman ini untuk admin sahaja.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-brand-500 hover:underline">← Kembali ke Dashboard</Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-brand-500">Dashboard</Link>
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
        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { l: "Pengguna", v: stats?.users ?? 0 },
            { l: "Kempen", v: stats?.campaigns ?? 0 },
            { l: "Tugasan Terbuka", v: stats?.open_tasks ?? 0 },
            { l: "Submission Baru", v: stats?.pending_subs ?? 0, hot: true },
            { l: "Withdraw Baru", v: stats?.pending_withdrawals ?? 0, hot: true },
            { l: "Jumlah Wallet", v: rm(stats?.wallet_total ?? 0) },
          ].map((s) => (
            <div key={s.l} className={`rounded-2xl border p-4 ${s.hot && Number(s.v) > 0 ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <p className="text-xs text-slate-500">{s.l}</p>
              <p className="mt-1 text-xl font-bold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="mt-8 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t ? "border-brand-500 text-brand-500" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              {t}
              {t === "Submissions" && subs.length > 0 && <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 text-xs text-white">{subs.length}</span>}
              {t === "Pengeluaran" && wds.length > 0 && <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 text-xs text-white">{wds.length}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Ringkasan" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Panel Kawalan Admin</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Cipta tugasan untuk pengguna, luluskan submission (wallet dikreditkan automatik),
                dan proses permohonan pengeluaran. Semua data live dari Supabase.
              </p>
            </div>
          )}

          {tab === "Cipta Tugasan" && (
            <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Cipta Tugasan Baru</h2>
              <label className="mt-4 block text-sm font-medium">Kategori</label>
              <select
                value={platform}
                onChange={(e) => {
                  const p = e.target.value;
                  setPlatform(p);
                  setAction(p === "AI" ? AI_ACTIONS[0] : "Follow akaun");
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium">Arahan tugasan</label>
              {platform === "AI" ? (
                <select value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                  {AI_ACTIONS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              ) : (
                <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="cth: Follow & like 3 post" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
              )}

              <label className="mt-4 block text-sm font-medium">Link sasaran (akaun/post untuk pengguna buka)</label>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@akaun"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />

              <label className="mt-4 block text-sm font-medium">Jenis bukti diperlukan</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { k: "image", l: "📷 Gambar" },
                  { k: "video", l: "🎬 Video" },
                  { k: "link", l: "🔗 Link/Username" },
                ].map((p) => (
                  <button
                    key={p.k}
                    type="button"
                    onClick={() => toggleProof(p.k)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                      proofTypes.includes(p.k)
                        ? "bg-brand-500 text-white"
                        : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Ganjaran (RM)</label>
                  <input type="number" step="0.01" min="0.01" value={reward} onChange={(e) => setReward(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Bilangan</label>
                  <input type="number" min="1" max="1000" value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                </div>
              </div>

              <button onClick={createTasks} disabled={busy} className="mt-5 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {busy ? "Mencipta…" : `Cipta ${count} Tugasan`}
              </button>
            </div>
          )}

          {tab === "Submissions" && (
            <div className="space-y-3">
              {subs.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">Tiada submission menunggu ✅</p>}
              {subs.map((s) => {
                const isVideo = s.proof_url ? /\.(mp4|webm|mov|m4v)($|\?)/i.test(s.proof_url) : false;
                return (
                  <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Tugasan #{s.task_id}</p>
                        {s.proof && <p className="text-sm text-slate-500">🔗 Bukti teks: {s.proof}</p>}
                        <p className="text-xs text-slate-400">User {s.user_id.slice(0, 8)}… · {new Date(s.created_at).toLocaleString("ms-MY")}</p>
                        {s.proof_url && (
                          <div className="mt-3">
                            {isVideo ? (
                              <video src={s.proof_url} controls className="max-h-56 rounded-xl border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <a href={s.proof_url} target="_blank">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.proof_url} alt="Bukti" className="max-h-56 rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approve(s.id)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Lulus</button>
                        <button onClick={() => reject(s.id)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Tolak</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Pengeluaran" && (
            <div className="space-y-3">
              {wds.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">Tiada permohonan pengeluaran ✅</p>}
              {wds.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <p className="font-semibold text-brand-500">{rm(w.amount)}</p>
                    <p className="text-sm text-slate-500">{w.method}</p>
                    <p className="text-xs text-slate-400">User {w.user_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => processWd(w.id, true)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Bayar</button>
                    <button onClick={() => processWd(w.id, false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Pengguna" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Peranan</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                      <td className="px-4 py-3">{u.whatsapp || "—"}</td>
                      <td className="px-4 py-3">{rm(u.wallet_balance)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
