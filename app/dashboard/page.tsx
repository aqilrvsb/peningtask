"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/site";
import { PlatformIcon } from "@/components/icons";
import { createClient, hasSupabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null; whatsapp: string | null; wallet_balance: number; ref_code: string | null;
  role: string; xp: number; level: number; total_earned: number; tasks_done: number;
  bank_name: string | null; bank_account: string | null; ic_number: string | null;
  url_facebook: string | null; url_threads: string | null; url_instagram: string | null;
  url_youtube: string | null; url_tiktok: string | null;
};
type Job = { id: number; platform: string; action: string; reward: number; proof_types: string[]; target_url: string | null; vendor_name: string | null; vendor_logo: string | null };
type MyJob = { submission_id: number; task_id: number; platform: string; action: string; reward: number; status: string; proof: string | null; proof_url: string | null; reject_reason: string | null; vendor_name: string | null; created_at: string };
type Txn = { id: number; amount: number; kind: string; note: string | null; created_at: string };
type Wd = { id: number; amount: number; method: string | null; status: string; created_at: string };
type Notif = { id: number; title: string; body: string | null; read: boolean; created_at: string };

const NAV = [
  { key: "ringkasan", icon: "📊", label: "Ringkasan" },
  { key: "marketplace", icon: "🛒", label: "Marketplace Job" },
  { key: "proses", icon: "⏳", label: "Kerja Diproses" },
  { key: "berjaya", icon: "✅", label: "Kerja Berjaya" },
  { key: "ditolak", icon: "❌", label: "Kerja Ditolak" },
  { key: "wallet", icon: "👛", label: "Wallet" },
  { key: "affiliate", icon: "🔗", label: "Affiliate" },
  { key: "tetapan", icon: "⚙️", label: "Tetapan" },
];
const PLATFORMS = ["Semua", "Facebook", "Threads", "Instagram", "YouTube", "TikTok"];
const ICON_KEY: Record<string, string> = { Facebook: "facebook", Threads: "threads", Instagram: "instagram", YouTube: "youtube", TikTok: "tiktok" };
const URL_FIELD: Record<string, keyof Profile> = { Facebook: "url_facebook", Threads: "url_threads", Instagram: "url_instagram", YouTube: "url_youtube", TikTok: "url_tiktok" };

function rm(n: unknown) { return "RM " + Number(n || 0).toFixed(2); }
function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) { const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000); return h <= 0 ? "baru" : `${h} jam lalu`; }
  return `${d} hari lalu`;
}

export default function Dashboard() {
  const supabase = useMemo(() => (hasSupabase ? createClient() : null), []);
  const [section, setSection] = useState("ringkasan");
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const [mpPlatform, setMpPlatform] = useState("Semua");
  const [jobPlatform, setJobPlatform] = useState("Semua");
  const [jobDate, setJobDate] = useState("");

  // apply modal
  const [activeTask, setActiveTask] = useState<Job | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // settings
  const [f, setF] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/log-masuk"; return; }
    const uid = auth.user.id;
    const [p, mj, jb, w, wd, nf] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.rpc("client_my_jobs"),
      supabase.rpc("open_tasks"),
      supabase.from("wallet_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
      supabase.from("withdrawals").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(15),
      supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(15),
    ]);
    if (p.data) {
      const pr = p.data as Profile;
      setProfile(pr);
      setF({
        full_name: pr.full_name ?? "", whatsapp: pr.whatsapp ?? "", ic_number: pr.ic_number ?? "",
        bank_name: pr.bank_name ?? "", bank_account: pr.bank_account ?? "",
        url_facebook: pr.url_facebook ?? "", url_threads: pr.url_threads ?? "", url_instagram: pr.url_instagram ?? "",
        url_youtube: pr.url_youtube ?? "", url_tiktok: pr.url_tiktok ?? "",
      });
    }
    setMyJobs((mj.data as MyJob[]) ?? []);
    setJobs((jb.data as Job[]) ?? []);
    setTxns((w.data as Txn[]) ?? []);
    setWds((wd.data as Wd[]) ?? []);
    setNotifs((nf.data as Notif[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const unread = notifs.filter((n) => !n.read).length;
  async function openNotif() {
    setShowNotif((v) => !v);
    if (!showNotif && unread > 0 && supabase) { await supabase.rpc("mark_notifications_read"); setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))); }
  }

  function tryApply(job: Job) {
    const field = URL_FIELD[job.platform];
    if (field && !(profile?.[field])) {
      flash(`⚠️ Isi URL profil ${job.platform} anda di Tetapan dahulu.`);
      setSection("tetapan");
      return;
    }
    setActiveTask(job); setProofText(""); setProofFile(null);
  }

  async function submitProof() {
    if (!supabase || !activeTask) return;
    const needFile = activeTask.proof_types?.includes("image") || activeTask.proof_types?.includes("video");
    const needLink = activeTask.proof_types?.includes("link");
    if (needFile && !proofFile) return flash("⚠️ Muat naik bukti gambar/video");
    if (needLink && !proofText.trim()) return flash("⚠️ Masukkan link/username");
    setSubmitting(true);
    let url: string | null = null;
    if (proofFile) {
      const { data: auth } = await supabase.auth.getUser();
      const ext = proofFile.name.split(".").pop() || "bin";
      const path = `${auth.user!.id}/${activeTask.id}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, proofFile);
      if (upErr) { setSubmitting(false); return flash("❌ Muat naik gagal: " + upErr.message); }
      url = supabase.storage.from("proofs").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.rpc("submit_task", { p_task_id: activeTask.id, p_proof: proofText || null, p_proof_url: url });
    setSubmitting(false);
    if (error) return flash("❌ " + error.message);
    flash("✅ Permohonan dihantar! Menunggu semakan vendor.");
    setActiveTask(null); load(); setSection("proses");
  }

  async function topup() {
    if (!supabase) return; const v = prompt("Jumlah topup (RM):", "20"); if (!v) return;
    const { error } = await supabase.rpc("topup_wallet", { p_amount: Number(v) });
    flash(error ? "❌ " + error.message : "✅ Wallet ditambah " + rm(Number(v))); if (!error) load();
  }
  async function withdraw() {
    if (!supabase || !profile) return;
    if (!profile.full_name || !profile.ic_number || !profile.bank_name || !profile.bank_account) {
      flash("⚠️ Lengkapkan Nama, IC, Bank & No. Akaun di Tetapan dahulu."); setSection("tetapan"); return;
    }
    const v = prompt("Jumlah pengeluaran (RM):"); if (!v) return;
    const method = `${profile.bank_name} ${profile.bank_account}`;
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: Number(v), p_method: method });
    flash(error ? "❌ " + error.message : "✅ Permohonan dihantar. Diproses dalam 24 jam."); if (!error) load();
  }

  async function saveSettings() {
    if (!supabase) return; setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, whatsapp: f.whatsapp, ic_number: f.ic_number, bank_name: f.bank_name, bank_account: f.bank_account,
      url_facebook: f.url_facebook, url_threads: f.url_threads, url_instagram: f.url_instagram, url_youtube: f.url_youtube, url_tiktok: f.url_tiktok,
    }).eq("id", auth.user!.id);
    setSaving(false);
    flash(error ? "❌ " + error.message : "✅ Tetapan disimpan"); if (!error) load();
  }

  const refLink = typeof window !== "undefined" && profile?.ref_code ? `${window.location.origin}/?ref=${profile.ref_code}` : "";
  const xpInLevel = (profile?.xp ?? 0) % 100;
  const shownJobs = mpPlatform === "Semua" ? jobs : jobs.filter((j) => j.platform === mpPlatform);
  const filterMine = (status: string) => myJobs.filter((j) => j.status === status)
    .filter((j) => jobPlatform === "Semua" || j.platform === jobPlatform)
    .filter((j) => !jobDate || j.created_at.slice(0, 10) === jobDate);
  const activeLabel = NAV.find((n) => n.key === section)?.label ?? "";

  const setField = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const inp = (k: string, label: string, ph = "") => (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input value={f[k] ?? ""} onChange={(e) => setField(k, e.target.value)} placeholder={ph} className="mt-1 w-full rounded-xl px-4 py-2.5" />
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className={`${navOpen ? "block" : "hidden"} border-r border-slate-200/70 bg-white/70 backdrop-blur lg:block lg:w-60 lg:shrink-0 dark:border-white/10 dark:bg-slate-950/60`}>
        <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
          <Logo />
          <nav className="mt-6 space-y-1">
            {NAV.map((it) => (
              <button key={it.key} onClick={() => { setSection(it.key); setNavOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${section === it.key ? "bg-brand-gradient text-white shadow-glow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                <span className="text-base">{it.icon}</span>{it.label}
                {it.key === "proses" && filterMine("pending").length > 0 && <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{filterMine("pending").length}</span>}
              </button>
            ))}
          </nav>
          <button onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/log-masuk"; }} className="mt-6 block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Log Keluar</button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <header className="pj-glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden dark:border-white/10">☰</button>
            <h1 className="text-lg font-extrabold tracking-tight">{activeLabel}</h1>
          </div>
          <div className="relative">
            <button onClick={openNotif} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5">🔔
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">{unread}</span>}
            </button>
            {showNotif && (
              <div className="pj-card absolute right-0 top-12 z-50 w-80 overflow-hidden p-0">
                <p className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold dark:border-white/10">Notifikasi</p>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? <p className="p-5 text-center text-sm text-slate-400">Tiada notifikasi.</p> :
                    notifs.map((n) => <div key={n.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-white/5"><p className="text-sm font-semibold">{n.title}</p>{n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}</div>)}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {loading ? <p className="py-24 text-center text-slate-400">Memuatkan…</p> : (
          <>
          {section === "ringkasan" && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-glow lg:col-span-2">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                  <p className="text-sm text-white/80">Baki Wallet</p>
                  <p className="mt-1 text-4xl font-extrabold">{rm(profile?.wallet_balance)}</p>
                  <div className="mt-5"><div className="flex justify-between text-xs text-white/80"><span>Level {profile?.level ?? 1} ⭐</span><span>{xpInLevel}/100 XP</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${xpInLevel}%` }} /></div></div>
                </div>
                <div className="pj-card p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-lg dark:bg-brand-500/10">💰</span>Jumlah Diperoleh</div><p className="mt-3 text-2xl font-extrabold text-gradient">{rm(profile?.total_earned)}</p></div>
                <div className="pj-card p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-lg">✅</span>Tugasan Selesai</div><p className="mt-3 text-2xl font-extrabold">{profile?.tasks_done ?? 0}</p></div>
              </div>
              <div className="pj-card p-6">
                <h2 className="text-lg font-semibold">Selamat datang, {profile?.full_name} 👋</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Cari kerja di Marketplace, siapkan & hantar bukti untuk dapat ganjaran.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setSection("marketplace")} className="pj-btn-primary px-5 py-2.5">🛒 Cari Job ({jobs.length})</button>
                  <button onClick={() => setSection("tetapan")} className="pj-btn-ghost px-5 py-2.5">⚙️ Lengkapkan Profil</button>
                </div>
              </div>
            </div>
          )}

          {section === "marketplace" && (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => <button key={p} onClick={() => setMpPlatform(p)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${mpPlatform === p ? "bg-brand-gradient text-white shadow-glow-sm" : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>{p}</button>)}
              </div>
              {shownJobs.length === 0 ? <p className="pj-card p-12 text-center text-slate-400">Tiada job {mpPlatform !== "Semua" ? mpPlatform : ""} buat masa ini. Semak semula nanti 🙌</p> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {shownJobs.map((j) => (
                    <div key={j.id} className="pj-card pj-card-hover flex flex-col p-5">
                      <div className="flex items-center gap-3">
                        {j.vendor_logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={j.vendor_logo} alt="" className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-white/10" /> : ICON_KEY[j.platform] ? <PlatformIcon name={ICON_KEY[j.platform]} size={44} /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 dark:bg-white/5">⭐</span>}
                        <div className="min-w-0"><p className="truncate font-bold">{j.action}</p><p className="text-xs text-slate-500">{j.platform} · oleh <b>{j.vendor_name}</b></p></div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div><span className="text-2xl font-extrabold text-gradient">{rm(j.reward)}</span></div>
                        <button onClick={() => tryApply(j)} className="pj-btn-primary px-4 py-2">Mohon Job</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(section === "proses" || section === "berjaya" || section === "ditolak") && (() => {
            const status = section === "proses" ? "pending" : section === "berjaya" ? "approved" : "rejected";
            const rows = filterMine(status);
            return (
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {PLATFORMS.map((p) => <button key={p} onClick={() => setJobPlatform(p)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${jobPlatform === p ? "bg-brand-gradient text-white" : "border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}>{p}</button>)}
                  <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="ml-auto rounded-xl px-3 py-1.5 text-sm" />
                  {jobDate && <button onClick={() => setJobDate("")} className="text-sm text-slate-500 hover:underline">reset</button>}
                </div>
                {rows.length === 0 ? <p className="pj-card p-12 text-center text-slate-400">Tiada kerja dalam kategori ini.</p> : (
                  <div className="space-y-3">
                    {rows.map((j) => (
                      <div key={j.submission_id} className="pj-card p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{j.action}</p>
                            <p className="text-sm text-slate-500">{j.platform} · oleh {j.vendor_name} · {daysAgo(j.created_at)}</p>
                            {j.status === "rejected" && <p className="mt-1 text-sm text-rose-600">Sebab ditolak: {j.reject_reason || "Bukti tidak lengkap / disyaki tidak sah."}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gradient">{rm(j.reward)}</p>
                            <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${j.status === "approved" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : j.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{j.status === "approved" ? "Berjaya" : j.status === "rejected" ? "Ditolak" : "Diproses"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {section === "wallet" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="pj-card p-6">
                  <p className="text-sm text-slate-500">Baki tersedia (komisyen &amp; ganjaran)</p>
                  <p className="mt-1 text-3xl font-extrabold text-gradient">{rm(profile?.wallet_balance)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={withdraw} className="pj-btn-primary px-5 py-2.5">Withdraw</button>
                    <button onClick={topup} className="pj-btn-ghost px-5 py-2.5">Topup</button>
                  </div>
                  {(!profile?.bank_account || !profile?.ic_number) && <p className="mt-3 text-xs text-amber-600">⚠️ Lengkapkan maklumat bank &amp; IC di Tetapan sebelum withdraw.</p>}
                </div>
                <div className="pj-card overflow-hidden p-0">
                  <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-white/10">Sejarah Pengeluaran</p>
                  {wds.length === 0 ? <p className="p-5 text-center text-sm text-slate-400">Tiada pengeluaran.</p> : <ul className="divide-y divide-slate-100 dark:divide-white/5">{wds.map((w) => <li key={w.id} className="flex items-center justify-between px-4 py-3 text-sm"><div><p className="font-semibold">{rm(w.amount)}</p><p className="text-xs text-slate-400">{w.method}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${w.status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : w.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{w.status === "paid" ? "Dibayar" : w.status === "rejected" ? "Ditolak" : "Menunggu"}</span></li>)}</ul>}
                </div>
              </div>
              <div className="pj-card overflow-hidden p-0">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-white/10">Transaksi Terkini</p>
                {txns.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">Tiada transaksi.</p> : <ul className="divide-y divide-slate-100 dark:divide-white/5">{txns.map((x) => <li key={x.id} className="flex items-center justify-between px-4 py-3 text-sm"><span className="text-slate-600 dark:text-slate-300">{x.note ?? x.kind}</span><span className={`font-semibold ${x.amount >= 0 ? "text-brand-600" : "text-rose-500"}`}>{x.amount >= 0 ? "+" : ""}{rm(x.amount)}</span></li>)}</ul>}
              </div>
            </div>
          )}

          {section === "affiliate" && (
            <div className="pj-card max-w-xl p-6">
              <h2 className="text-lg font-semibold">Program Affiliate 💰</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Dapat <b>RM0.10</b> setiap rakan mendaftar + <b>komisyen 10%</b> topup mereka. Automatik masuk wallet.</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5">
                <code className="flex-1 truncate px-2 text-sm">{refLink || "—"}</code>
                <button onClick={() => { navigator.clipboard?.writeText(refLink); flash("✅ Link disalin!"); }} className="pj-btn-primary px-4 py-2">Salin</button>
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent("Jom join PeningJob — buat tugasan, dapat duit! " + refLink)}`} target="_blank" className="pj-btn-ghost mt-3 inline-flex px-4 py-2">Kongsi ke WhatsApp →</a>
            </div>
          )}

          {section === "tetapan" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="pj-card p-6">
                <h2 className="text-lg font-semibold">🔗 Profil Sosial</h2>
                <p className="mt-1 text-sm text-slate-500">Wajib isi URL platform sebelum boleh mohon job platform tersebut (vendor sahkan akaun anda benar).</p>
                <div className="mt-4 space-y-3">
                  {inp("url_facebook", "Facebook", "https://facebook.com/anda")}
                  {inp("url_threads", "Threads", "https://threads.net/@anda")}
                  {inp("url_instagram", "Instagram", "https://instagram.com/anda")}
                  {inp("url_youtube", "YouTube", "https://youtube.com/@anda")}
                  {inp("url_tiktok", "TikTok", "https://tiktok.com/@anda")}
                </div>
              </div>
              <div className="pj-card h-fit p-6">
                <h2 className="text-lg font-semibold">🏦 Akaun &amp; Bank (untuk withdraw)</h2>
                <div className="mt-4 space-y-3">
                  {inp("full_name", "Nama Penuh (seperti IC)")}
                  {inp("ic_number", "No. Kad Pengenalan (IC)", "cth: 900101-01-1234")}
                  {inp("whatsapp", "No. Telefon")}
                  {inp("bank_name", "Nama Bank / e-Wallet", "cth: Maybank / TNG")}
                  {inp("bank_account", "No. Akaun")}
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5">🔒 IC & bank disimpan selamat, hanya anda &amp; admin boleh lihat.</div>
              </div>
              <div className="lg:col-span-2">
                <button onClick={saveSettings} disabled={saving} className="pj-btn-primary w-full py-3.5 lg:w-auto lg:px-10">{saving ? "Menyimpan…" : "Simpan Semua Tetapan"}</button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {/* Apply modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setActiveTask(null)}>
          <div className="pj-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {ICON_KEY[activeTask.platform] && <PlatformIcon name={ICON_KEY[activeTask.platform]} size={44} />}
                <div><h3 className="text-lg font-bold">{activeTask.action}</h3><p className="mt-1 text-sm text-slate-500">oleh <b>{activeTask.vendor_name}</b> · Ganjaran <b className="text-brand-600">{rm(activeTask.reward)}</b></p></div>
              </div>
              <button onClick={() => setActiveTask(null)} className="text-slate-400">✕</button>
            </div>
            <ol className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
              <li>1️⃣ Buka link sasaran</li><li>2️⃣ Selesaikan: <b>{activeTask.action}</b></li><li>3️⃣ Hantar bukti</li>
            </ol>
            {activeTask.target_url && <a href={activeTask.target_url} target="_blank" className="mt-3 block truncate rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10">🔗 Buka Link Sasaran</a>}
            {(activeTask.proof_types?.includes("image") || activeTask.proof_types?.includes("video")) && (
              <div className="mt-4"><label className="block text-sm font-medium">Muat naik bukti</label><input type="file" accept={[activeTask.proof_types?.includes("image") ? "image/*" : "", activeTask.proof_types?.includes("video") ? "video/*" : ""].filter(Boolean).join(",")} onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />{proofFile && <p className="mt-1 text-xs text-brand-500">✓ {proofFile.name}</p>}</div>
            )}
            {activeTask.proof_types?.includes("link") && <div className="mt-4"><label className="block text-sm font-medium">Link / username anda</label><input value={proofText} onChange={(e) => setProofText(e.target.value)} placeholder="cth: @username_saya" className="mt-1 w-full rounded-xl px-4 py-2.5" /></div>}
            <button onClick={submitProof} disabled={submitting} className="pj-btn-primary mt-5 w-full py-3">{submitting ? "Menghantar…" : "Hantar Bukti & Mohon"}</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">{toast}</div>}
    </div>
  );
}
