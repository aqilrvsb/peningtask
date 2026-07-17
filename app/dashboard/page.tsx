"use client";

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
type Job = { id: number; platform: string; action: string; reward: number; target_url: string | null; vendor_name: string | null; vendor_logo: string | null };
type MyJob = { submission_id: number; task_id: number; platform: string; action: string; reward: number; status: string; proof: string | null; proof_url: string | null; reject_reason: string | null; target_url: string | null; vendor_name: string | null; created_at: string };
type Txn = { id: number; amount: number; kind: string; note: string | null; created_at: string };
type Wd = { id: number; amount: number; method: string | null; status: string; created_at: string };
type Notif = { id: number; title: string; body: string | null; read: boolean; created_at: string };

const NAV = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "marketplace", icon: "🛒", label: "Marketplace" },
  { key: "pending", icon: "⏳", label: "Job Pending" },
  { key: "process", icon: "🔄", label: "Job Process" },
  { key: "success", icon: "✅", label: "Job Success" },
  { key: "rejected", icon: "❌", label: "Job Rejected" },
  { key: "wallet", icon: "👛", label: "Wallet" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];
const PLATFORMS = ["All", "Facebook", "Threads", "Instagram", "YouTube", "TikTok"];
const ICON_KEY: Record<string, string> = { Facebook: "facebook", Threads: "threads", Instagram: "instagram", YouTube: "youtube", TikTok: "tiktok" };
const URL_FIELD: Record<string, keyof Profile> = { Facebook: "url_facebook", Threads: "url_threads", Instagram: "url_instagram", YouTube: "url_youtube", TikTok: "url_tiktok" };
const STATUS_OF: Record<string, string> = { pending: "accepted", process: "pending", success: "approved", rejected: "rejected" };

function rm(n: unknown) { return "RM " + Number(n || 0).toFixed(2); }
function daysAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d <= 0) { const h = Math.floor(ms / 3600000); return h <= 0 ? "just now" : `${h}h ago`; }
  return `${d}d ago`;
}

export default function Dashboard() {
  const supabase = useMemo(() => (hasSupabase ? createClient() : null), []);
  const [section, setSection] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [wsum, setWsum] = useState<{ total_commission: number; total_withdrawn: number; pending_withdrawal: number; balance: number } | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const [mpPlatform, setMpPlatform] = useState("All");
  const [jobPlatform, setJobPlatform] = useState("All");
  const [jobDate, setJobDate] = useState("");

  // submit-proof modal (for an accepted/pending job)
  const [submitTarget, setSubmitTarget] = useState<MyJob | null>(null);
  const [descText, setDescText] = useState("");
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
    const [p, mj, jb, w, wd, nf, ws] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.rpc("client_my_jobs"),
      supabase.rpc("open_tasks"),
      supabase.from("wallet_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
      supabase.from("withdrawals").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(15),
      supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(15),
      supabase.rpc("client_wallet_summary"),
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
    setWsum((Array.isArray(ws.data) ? ws.data[0] : ws.data) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const unread = notifs.filter((n) => !n.read).length;
  async function openNotif() {
    setShowNotif((v) => !v);
    if (!showNotif && unread > 0 && supabase) { await supabase.rpc("mark_notifications_read"); setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))); }
  }

  async function acceptJob(job: Job) {
    if (!supabase) return;
    const field = URL_FIELD[job.platform];
    if (field && !(profile?.[field])) {
      flash(`⚠️ Fill your ${job.platform} profile URL in Settings first.`);
      setSection("settings");
      return;
    }
    const { error } = await supabase.rpc("accept_job", { p_task_id: job.id });
    if (error) return flash("❌ " + error.message);
    flash("✅ Job accepted! Complete it, then submit your proof.");
    await load();
    setSection("pending");
  }

  async function submitJobProof() {
    if (!supabase || !submitTarget) return;
    if (!proofFile) return flash("⚠️ Upload a screenshot proof");
    if (!descText.trim()) return flash("⚠️ Add a description");
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const ext = proofFile.name.split(".").pop() || "png";
    const path = `${auth.user!.id}/${submitTarget.task_id}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("proofs").upload(path, proofFile);
    if (upErr) { setSubmitting(false); return flash("❌ Upload failed: " + upErr.message); }
    const url = supabase.storage.from("proofs").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.rpc("submit_job", { p_sub_id: submitTarget.submission_id, p_desc: descText, p_proof_url: url });
    setSubmitting(false);
    if (error) return flash("❌ " + error.message);
    flash("✅ Submitted! Waiting for vendor review.");
    setSubmitTarget(null); setDescText(""); setProofFile(null);
    await load(); setSection("process");
  }

  async function withdraw() {
    if (!supabase || !profile) return;
    if (!profile.full_name || !profile.ic_number || !profile.bank_name || !profile.bank_account) {
      flash("⚠️ Complete Full Name, IC, Bank & Account in Settings first."); setSection("settings"); return;
    }
    const v = prompt("Withdraw amount (RM):"); if (!v) return;
    const method = `${profile.bank_name} ${profile.bank_account}`;
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: Number(v), p_method: method });
    flash(error ? "❌ " + error.message : "✅ Request sent. Processed within 24h."); if (!error) load();
  }

  async function saveSettings() {
    if (!supabase) return; setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, whatsapp: f.whatsapp, ic_number: f.ic_number, bank_name: f.bank_name, bank_account: f.bank_account,
      url_facebook: f.url_facebook, url_threads: f.url_threads, url_instagram: f.url_instagram, url_youtube: f.url_youtube, url_tiktok: f.url_tiktok,
    }).eq("id", auth.user!.id);
    setSaving(false);
    flash(error ? "❌ " + error.message : "✅ Settings saved"); if (!error) load();
  }

  const xpInLevel = (profile?.xp ?? 0) % 100;
  const shownJobs = mpPlatform === "All" ? jobs : jobs.filter((j) => j.platform === mpPlatform);
  const mine = (status: string, withDate: boolean) => myJobs.filter((j) => j.status === status)
    .filter((j) => jobPlatform === "All" || j.platform === jobPlatform)
    .filter((j) => !withDate || !jobDate || j.created_at.slice(0, 10) === jobDate);
  const activeLabel = NAV.find((n) => n.key === section)?.label ?? "";
  const pendingCount = myJobs.filter((j) => j.status === "accepted").length;

  const setField = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const inp = (k: string, label: string, ph = "") => (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input value={f[k] ?? ""} onChange={(e) => setField(k, e.target.value)} placeholder={ph} className="mt-1 w-full rounded-xl px-4 py-2.5" />
    </div>
  );

  const statusBadge = (s: string) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s === "approved" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : s === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : s === "accepted" ? "bg-slate-100 text-slate-600 dark:bg-white/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>
      {s === "approved" ? "Success" : s === "rejected" ? "Rejected" : s === "accepted" ? "Pending" : "In Review"}
    </span>
  );

  function JobList({ status, withDate, showSubmit }: { status: string; withDate: boolean; showSubmit?: boolean }) {
    const rows = mine(status, withDate);
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PLATFORMS.map((p) => <button key={p} onClick={() => setJobPlatform(p)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${jobPlatform === p ? "bg-brand-gradient text-white" : "border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}>{p}</button>)}
          {withDate && <><input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="ml-auto rounded-xl px-3 py-1.5 text-sm" />{jobDate && <button onClick={() => setJobDate("")} className="text-sm text-slate-500 hover:underline">reset</button>}</>}
        </div>
        {rows.length === 0 ? <p className="pj-card p-12 text-center text-slate-400">No jobs in this category.</p> : (
          <div className="space-y-3">
            {rows.map((j) => (
              <div key={j.submission_id} className="pj-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{j.action}</p>
                    <p className="text-sm text-slate-500">{j.platform} · by {j.vendor_name} · {daysAgo(j.created_at)}</p>
                    {status === "rejected" && <p className="mt-1 text-sm text-rose-600">Reason: {j.reject_reason || "Proof incomplete / suspected invalid."}</p>}
                    {showSubmit && j.target_url && <a href={j.target_url} target="_blank" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">🔗 Open target link</a>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-gradient">{rm(j.reward)}</p>
                    {showSubmit ? (
                      <button onClick={() => { setSubmitTarget(j); setDescText(""); setProofFile(null); }} className="pj-btn-primary px-4 py-2">Submit Proof</button>
                    ) : statusBadge(j.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
                {it.key === "pending" && pendingCount > 0 && <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{pendingCount}</span>}
              </button>
            ))}
          </nav>
          <button onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/log-masuk"; }} className="mt-6 block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Log Out</button>
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
                <p className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold dark:border-white/10">Notifications</p>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? <p className="p-5 text-center text-sm text-slate-400">No notifications.</p> :
                    notifs.map((n) => <div key={n.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-white/5"><p className="text-sm font-semibold">{n.title}</p>{n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}</div>)}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {loading ? <p className="py-24 text-center text-slate-400">Loading…</p> : (
          <>
          {section === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-glow lg:col-span-2">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                  <p className="text-sm text-white/80">Wallet Balance</p>
                  <p className="mt-1 text-4xl font-extrabold">{rm(profile?.wallet_balance)}</p>
                  <div className="mt-5"><div className="flex justify-between text-xs text-white/80"><span>Level {profile?.level ?? 1} ⭐</span><span>{xpInLevel}/100 XP</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${xpInLevel}%` }} /></div></div>
                </div>
                <div className="pj-card p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-lg dark:bg-brand-500/10">💰</span>Total Earned</div><p className="mt-3 text-2xl font-extrabold text-gradient">{rm(profile?.total_earned)}</p></div>
                <div className="pj-card p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-lg">✅</span>Jobs Completed</div><p className="mt-3 text-2xl font-extrabold">{profile?.tasks_done ?? 0}</p></div>
              </div>
              <div className="pj-card p-6">
                <h2 className="text-lg font-semibold">Welcome, {profile?.full_name} 👋</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Find jobs in the Marketplace, complete them & submit proof to earn rewards.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setSection("marketplace")} className="pj-btn-primary px-5 py-2.5">🛒 Browse Jobs ({jobs.length})</button>
                  <button onClick={() => setSection("settings")} className="pj-btn-ghost px-5 py-2.5">⚙️ Complete Profile</button>
                </div>
              </div>
            </div>
          )}

          {section === "marketplace" && (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => <button key={p} onClick={() => setMpPlatform(p)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${mpPlatform === p ? "bg-brand-gradient text-white shadow-glow-sm" : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>{p}</button>)}
              </div>
              {shownJobs.length === 0 ? <p className="pj-card p-12 text-center text-slate-400">No {mpPlatform !== "All" ? mpPlatform : ""} jobs right now. Check back soon 🙌</p> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {shownJobs.map((j) => (
                    <div key={j.id} className="pj-card pj-card-hover flex flex-col p-5">
                      <div className="flex items-center gap-3">
                        {j.vendor_logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={j.vendor_logo} alt="" className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-white/10" /> : ICON_KEY[j.platform] ? <PlatformIcon name={ICON_KEY[j.platform]} size={44} /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 dark:bg-white/5">⭐</span>}
                        <div className="min-w-0"><p className="truncate font-bold">{j.action}</p><p className="text-xs text-slate-500">{j.platform} · by <b>{j.vendor_name}</b></p></div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <span className="text-2xl font-extrabold text-gradient">{rm(j.reward)}</span>
                        <button onClick={() => acceptJob(j)} className="pj-btn-primary px-4 py-2">Apply</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "pending" && <JobList status="accepted" withDate={false} showSubmit />}
          {section === "process" && <JobList status="pending" withDate />}
          {section === "success" && <JobList status="approved" withDate />}
          {section === "rejected" && <JobList status="rejected" withDate />}

          {section === "wallet" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="pj-card p-4"><p className="text-xs text-slate-500">💰 Total Commission</p><p className="mt-1 text-xl font-extrabold text-gradient">{rm(wsum?.total_commission)}</p></div>
                  <div className="pj-card p-4"><p className="text-xs text-slate-500">💸 Total Withdrawal</p><p className="mt-1 text-xl font-extrabold">{rm(wsum?.total_withdrawn)}</p></div>
                </div>
                <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-glow">
                  <p className="text-sm text-white/80">Current Balance (Commission − Withdrawal)</p>
                  <p className="mt-1 text-3xl font-extrabold">{rm(wsum?.balance ?? profile?.wallet_balance)}</p>
                  {(wsum?.pending_withdrawal ?? 0) > 0 && <p className="mt-1 text-xs text-white/80">Pending: {rm(wsum?.pending_withdrawal)} (awaiting admin approval)</p>}
                  <button onClick={withdraw} className="mt-4 rounded-xl bg-white px-5 py-2.5 font-semibold text-brand-600 hover:scale-[1.02]">Request Withdraw</button>
                  {(!profile?.bank_account || !profile?.ic_number) && <p className="mt-3 text-xs text-white/90">⚠️ Complete Bank &amp; IC in Settings before withdrawing.</p>}
                </div>
                <div className="pj-card overflow-hidden p-0">
                  <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-white/10">Withdrawal History</p>
                  {wds.length === 0 ? <p className="p-5 text-center text-sm text-slate-400">No withdrawals yet.</p> : <ul className="divide-y divide-slate-100 dark:divide-white/5">{wds.map((w) => <li key={w.id} className="flex items-center justify-between px-4 py-3 text-sm"><div><p className="font-semibold">{rm(w.amount)}</p><p className="text-xs text-slate-400">{w.method}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${w.status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : w.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{w.status === "paid" ? "Paid" : w.status === "rejected" ? "Rejected" : "Pending"}</span></li>)}</ul>}
                </div>
              </div>
              <div className="pj-card overflow-hidden p-0">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-white/10">Recent Transactions</p>
                {txns.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">No transactions.</p> : <ul className="divide-y divide-slate-100 dark:divide-white/5">{txns.map((x) => <li key={x.id} className="flex items-center justify-between px-4 py-3 text-sm"><span className="text-slate-600 dark:text-slate-300">{x.note ?? x.kind}</span><span className={`font-semibold ${x.amount >= 0 ? "text-brand-600" : "text-rose-500"}`}>{x.amount >= 0 ? "+" : ""}{rm(x.amount)}</span></li>)}</ul>}
              </div>
            </div>
          )}

          {section === "settings" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="pj-card p-6">
                <h2 className="text-lg font-semibold">🔗 Social Profiles</h2>
                <p className="mt-1 text-sm text-slate-500">Required before applying to a job on that platform — so the vendor can verify your account is real.</p>
                <div className="mt-4 space-y-3">
                  {inp("url_facebook", "Facebook", "https://facebook.com/you")}
                  {inp("url_threads", "Threads", "https://threads.net/@you")}
                  {inp("url_instagram", "Instagram", "https://instagram.com/you")}
                  {inp("url_youtube", "YouTube", "https://youtube.com/@you")}
                  {inp("url_tiktok", "TikTok", "https://tiktok.com/@you")}
                </div>
              </div>
              <div className="pj-card h-fit p-6">
                <h2 className="text-lg font-semibold">🏦 Bank Details (for withdrawal)</h2>
                <div className="mt-4 space-y-3">
                  {inp("full_name", "Full Name (as per IC)")}
                  {inp("ic_number", "IC Number", "e.g. 900101-01-1234")}
                  {inp("whatsapp", "Phone Number")}
                  {inp("bank_name", "Bank Name", "e.g. Maybank")}
                  {inp("bank_account", "Account Number")}
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5">🔒 Your IC &amp; bank details are stored securely — visible only to you and admin.</div>
              </div>
              <div className="lg:col-span-2">
                <button onClick={saveSettings} disabled={saving} className="pj-btn-primary w-full py-3.5 lg:w-auto lg:px-10">{saving ? "Saving…" : "Save All Settings"}</button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {/* Submit-proof modal */}
      {submitTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setSubmitTarget(null)}>
          <div className="pj-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {ICON_KEY[submitTarget.platform] && <PlatformIcon name={ICON_KEY[submitTarget.platform]} size={44} />}
                <div><h3 className="text-lg font-bold">{submitTarget.action}</h3><p className="mt-1 text-sm text-slate-500">by <b>{submitTarget.vendor_name}</b> · Reward <b className="text-brand-600">{rm(submitTarget.reward)}</b></p></div>
              </div>
              <button onClick={() => setSubmitTarget(null)} className="text-slate-400">✕</button>
            </div>
            {submitTarget.target_url && <a href={submitTarget.target_url} target="_blank" className="mt-4 block truncate rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10">🔗 Open Target Link</a>}
            <div className="mt-4">
              <label className="block text-sm font-medium">Screenshot proof *</label>
              <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />
              {proofFile && <p className="mt-1 text-xs text-brand-500">✓ {proofFile.name}</p>}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium">Description *</label>
              <textarea value={descText} onChange={(e) => setDescText(e.target.value)} rows={3} placeholder="Describe what you did (e.g. followed the account with @myusername)" className="mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <button onClick={submitJobProof} disabled={submitting} className="pj-btn-primary mt-5 w-full py-3">{submitting ? "Submitting…" : "Submit Proof"}</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">{toast}</div>}
    </div>
  );
}
