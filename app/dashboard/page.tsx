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
  xp: number;
  level: number;
  total_earned: number;
  tasks_done: number;
  bank_name: string | null;
  bank_account: string | null;
};
type Task = {
  id: number;
  platform: string;
  action: string;
  reward: number;
  proof_types: string[];
  target_url: string | null;
  vendor_name: string | null;
  vendor_logo: string | null;
};
type Campaign = { id: number; platform: string; service_type: string; quantity: number; delivered: number; status: string };
type Txn = { id: number; amount: number; kind: string; note: string | null; created_at: string };
type Wd = { id: number; amount: number; method: string | null; status: string; created_at: string };
type Notif = { id: number; title: string; body: string | null; read: boolean; created_at: string };

const TABS = ["Ringkasan", "Tugasan", "Kempen Saya", "Wallet", "Affiliate", "Tetapan"] as const;
type Tab = (typeof TABS)[number];
const FILTERS = ["Semua", "Facebook", "Threads", "TikTok", "Instagram", "AI"];

const EMOJI: Record<string, string> = {
  Facebook: "👍",
  Threads: "🧵",
  TikTok: "🎵",
  Instagram: "📸",
  AI: "🤖",
};

const WD_LABEL: Record<string, string> = {
  requested: "Menunggu",
  paid: "Dibayar",
  rejected: "Ditolak",
};

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [filter, setFilter] = useState("Semua");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // settings form
  const [sName, setSName] = useState("");
  const [sWa, setSWa] = useState("");
  const [sBank, setSBank] = useState("");
  const [sAcc, setSAcc] = useState("");

  const supabase = hasSupabase ? createClient() : null;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
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
    const uid = auth.user.id;
    const [p, t, c, w, wd, nf] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.rpc("open_tasks"),
      supabase.from("campaigns").select("id,platform,service_type,quantity,delivered,status").eq("owner", uid).order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("id,amount,kind,note,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("id,amount,method,status,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
      supabase.from("notifications").select("id,title,body,read,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(15),
    ]);
    if (p.data) {
      const pr = p.data as Profile;
      setProfile(pr);
      setSName(pr.full_name ?? "");
      setSWa(pr.whatsapp ?? "");
      setSBank(pr.bank_name ?? "");
      setSAcc(pr.bank_account ?? "");
    }
    setTasks((t.data as Task[]) ?? []);
    setCampaigns((c.data as Campaign[]) ?? []);
    setTxns((w.data as Txn[]) ?? []);
    setWds((wd.data as Wd[]) ?? []);
    setNotifs((nf.data as Notif[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const unread = notifs.filter((n) => !n.read).length;

  async function openNotif() {
    setShowNotif((v) => !v);
    if (!showNotif && unread > 0 && supabase) {
      await supabase.rpc("mark_notifications_read");
      setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    }
  }

  // task modal state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsFile =
    !!activeTask &&
    (activeTask.proof_types?.includes("image") || activeTask.proof_types?.includes("video"));
  const needsLink = !!activeTask && activeTask.proof_types?.includes("link");
  const acceptTypes = activeTask
    ? [
        activeTask.proof_types?.includes("image") ? "image/*" : "",
        activeTask.proof_types?.includes("video") ? "video/*" : "",
      ]
        .filter(Boolean)
        .join(",")
    : "";

  async function submitProof() {
    if (!supabase || !activeTask) return;
    if (needsFile && !proofFile) {
      flash("⚠️ Sila muat naik bukti " + (acceptTypes.includes("video") ? "gambar/video" : "gambar"));
      return;
    }
    if (needsLink && !proofText.trim()) {
      flash("⚠️ Sila masukkan link / username sebagai bukti");
      return;
    }
    setSubmitting(true);
    let proofUrl: string | null = null;
    if (proofFile) {
      const { data: auth } = await supabase.auth.getUser();
      const ext = proofFile.name.split(".").pop() || "bin";
      const path = `${auth.user!.id}/${activeTask.id}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, proofFile);
      if (upErr) {
        setSubmitting(false);
        flash("❌ Muat naik gagal: " + upErr.message);
        return;
      }
      proofUrl = supabase.storage.from("proofs").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.rpc("submit_task", {
      p_task_id: activeTask.id,
      p_proof: proofText || null,
      p_proof_url: proofUrl,
    });
    setSubmitting(false);
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Dihantar! Ganjaran " + rm(activeTask.reward) + " selepas disemak.");
      setActiveTask(null);
      setProofText("");
      setProofFile(null);
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
    if (!supabase || !profile) return;
    if (!profile.bank_name || !profile.bank_account) {
      flash("⚠️ Sila isi maklumat bank di tab Tetapan dahulu.");
      setTab("Tetapan");
      return;
    }
    const v = prompt("Jumlah pengeluaran (RM):");
    if (!v) return;
    const method = `${profile.bank_name} ${profile.bank_account}`;
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: Number(v), p_method: method });
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Permohonan dihantar. Diproses dalam 24 jam.");
      load();
    }
  }

  async function saveSettings() {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: sName, whatsapp: sWa, bank_name: sBank, bank_account: sAcc })
      .eq("id", auth.user.id);
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Tetapan disimpan");
      load();
    }
  }

  const refLink =
    typeof window !== "undefined" && profile?.ref_code
      ? `${window.location.origin}/?ref=${profile.ref_code}`
      : "";

  const shownTasks = filter === "Semua" ? tasks : tasks.filter((t) => t.platform === filter);
  const xpInLevel = (profile?.xp ?? 0) % 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            {profile?.role === "admin" && (
              <Link href="/admin" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                Admin
              </Link>
            )}
            {(profile?.role === "vendor" || profile?.role === "admin") && (
              <Link href="/vendor" className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
                📣 Vendor
              </Link>
            )}
            {/* notifications bell */}
            <div className="relative">
              <button onClick={openNotif} aria-label="Notifikasi" className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700">
                🔔
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold dark:border-slate-800">Notifikasi</p>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="p-5 text-center text-sm text-slate-400">Tiada notifikasi lagi.</p>
                    ) : (
                      notifs.map((n) => (
                        <div key={n.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800/50">
                          <p className="text-sm font-semibold">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
            {/* Hero strip: level + stats */}
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-100">Baki Wallet</p>
                    <p className="mt-1 text-3xl font-bold">{rm(profile?.wallet_balance ?? 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-brand-100">Level {profile?.level ?? 1} ⭐</p>
                    <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full bg-white" style={{ width: `${xpInLevel}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-brand-100">{xpInLevel}/100 XP</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Jumlah Diperoleh</p>
                <p className="mt-1 text-2xl font-bold text-brand-500">{rm(profile?.total_earned ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Tugasan Selesai</p>
                <p className="mt-1 text-2xl font-bold">{profile?.tasks_done ?? 0}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 flex flex-wrap gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold">Selamat datang, {profile?.full_name} 👋</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Buat tugasan untuk kumpul ganjaran &amp; XP, atau lancar kempen untuk naikkan akaun sosial anda.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => setTab("Tugasan")} className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
                        Buat Tugasan ({tasks.length})
                      </button>
                      <Link href="/marketplace" className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        Lancar Kempen
                      </Link>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold">🏆 Papan Pendahulu</h3>
                    <p className="mt-1 text-sm text-slate-500">Lihat siapa paling banyak menjana di TugasKu.</p>
                    <Link href="/leaderboard" className="mt-3 inline-block font-semibold text-brand-500 hover:underline">
                      Lihat Leaderboard →
                    </Link>
                  </div>
                </div>
              )}

              {tab === "Tugasan" && (
                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                          filter === f
                            ? "bg-brand-500 text-white"
                            : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {EMOJI[f] ?? "✨"} {f}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {shownTasks.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">
                        Tiada tugasan {filter !== "Semua" ? filter : ""} buat masa ini. Semak semula nanti 🙌
                      </p>
                    )}
                    {shownTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          {t.vendor_logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.vendor_logo} alt={t.vendor_name ?? "Vendor"} className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
                          ) : (
                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                              {EMOJI[t.platform] ?? "⭐"}
                            </span>
                          )}
                          <div>
                            <p className="font-semibold">{t.action}</p>
                            <p className="text-sm text-slate-500">
                              {EMOJI[t.platform] ?? ""} {t.platform} · oleh <b>{t.vendor_name ?? "TugasKu"}</b> · +10 XP
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-brand-500">{rm(t.reward)}</span>
                          <button
                            onClick={() => {
                              setActiveTask(t);
                              setProofText("");
                              setProofFile(null);
                            }}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                          >
                            Mula
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                            <td className="px-4 py-3 font-medium">{EMOJI[c.platform]} {c.platform}</td>
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
                                {c.status === "completed" ? "Selesai" : "Berjalan"}
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
                <div className="grid gap-4 lg:grid-cols-2">
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
                      <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">Sejarah Pengeluaran</p>
                      {wds.length === 0 ? (
                        <p className="p-5 text-center text-sm text-slate-400">Tiada pengeluaran lagi.</p>
                      ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {wds.map((w) => (
                            <li key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
                              <div>
                                <p className="font-semibold">{rm(w.amount)}</p>
                                <p className="text-xs text-slate-400">{w.method}</p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${w.status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : w.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>
                                {WD_LABEL[w.status] ?? w.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
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
                  <h2 className="text-lg font-semibold">Program Affiliate 💰</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Dapat <b>RM0.10</b> setiap rakan mendaftar melalui link anda + <b>komisyen 10%</b> setiap kali mereka topup. Automatik masuk wallet.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                    <code className="flex-1 truncate px-2 text-sm">{refLink || "—"}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(refLink);
                        flash("✅ Link disalin — kongsi sekarang!");
                      }}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Salin
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent("Jom join TugasKu — buat tugasan ringkas, dapat duit! " + refLink)}`}
                    target="_blank"
                    className="mt-3 inline-block rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Kongsi ke WhatsApp →
                  </a>
                </div>
              )}

              {tab === "Tetapan" && (
                <div className="max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-semibold">Tetapan Akaun</h2>
                  <label className="block text-sm font-medium">Nama penuh</label>
                  <input value={sName} onChange={(e) => setSName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                  <label className="block text-sm font-medium">No. WhatsApp</label>
                  <input value={sWa} onChange={(e) => setSWa(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                  <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-100">
                    Maklumat bank diperlukan untuk pengeluaran (withdraw).
                  </div>
                  <label className="block text-sm font-medium">Nama bank / e-wallet</label>
                  <input value={sBank} onChange={(e) => setSBank(e.target.value)} placeholder="cth: Maybank / TNG" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                  <label className="block text-sm font-medium">No. akaun</label>
                  <input value={sAcc} onChange={(e) => setSAcc(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                  <button onClick={saveSettings} className="mt-2 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600">
                    Simpan Tetapan
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Task proof modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setActiveTask(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {activeTask.vendor_logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeTask.vendor_logo} alt="" className="h-12 w-12 rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
                )}
                <div>
                  <h3 className="text-lg font-bold">
                    {EMOJI[activeTask.platform] ?? "⭐"} {activeTask.action}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    oleh <b>{activeTask.vendor_name ?? "TugasKu"}</b> · {activeTask.platform} · Ganjaran{" "}
                    <b className="text-brand-500">{rm(activeTask.reward)}</b> · +10 XP
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <ol className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
              <li>1️⃣ Buka link sasaran di bawah</li>
              <li>2️⃣ Selesaikan: <b>{activeTask.action}</b></li>
              <li>
                3️⃣ Hantar bukti:{" "}
                <b>
                  {activeTask.proof_types
                    ?.map((p) => (p === "image" ? "Gambar" : p === "video" ? "Video" : "Link/Username"))
                    .join(" + ")}
                </b>
              </li>
            </ol>

            {activeTask.target_url && (
              <a
                href={activeTask.target_url}
                target="_blank"
                className="mt-3 block truncate rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              >
                🔗 Buka Link Sasaran
              </a>
            )}

            {needsFile && (
              <div className="mt-4">
                <label className="block text-sm font-medium">
                  Muat naik bukti ({acceptTypes.includes("video") && acceptTypes.includes("image") ? "gambar / video" : acceptTypes.includes("video") ? "video" : "gambar"})
                </label>
                <input
                  type="file"
                  accept={acceptTypes}
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700"
                />
                {proofFile && <p className="mt-1 text-xs text-brand-500">✓ {proofFile.name}</p>}
              </div>
            )}

            {needsLink && (
              <div className="mt-4">
                <label className="block text-sm font-medium">Link / username anda</label>
                <input
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="cth: @username_saya"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}

            <button
              onClick={submitProof}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? "Menghantar…" : "Hantar Bukti & Tuntut Ganjaran"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
