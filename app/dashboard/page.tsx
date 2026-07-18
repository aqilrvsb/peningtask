"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/site";
import { PlatformIcon } from "@/components/icons";
import { TicketCenter } from "@/components/tickets";
import { compressImage } from "@/lib/compress";
import { createClient, hasSupabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null; whatsapp: string | null; wallet_balance: number; ref_code: string | null;
  role: string; xp: number; level: number; total_earned: number; tasks_done: number;
  bank_name: string | null; bank_account: string | null; ic_number: string | null;
  tng_phone: string | null; tng_qr_url: string | null;
  url_facebook: string | null; url_threads: string | null; url_instagram: string | null;
  url_youtube: string | null; url_tiktok: string | null;
};
type Job = {
  id: number; platform: string; title: string; description: string | null; reward: number;
  quota: number; taken: number; duration_min: number | null; evidence_type: string;
  claim_mode: string; per_user_quota: number; deadline: string | null; target_url: string | null;
  example_urls: string[]; vendor_name: string | null; vendor_logo: string | null; created_at: string;
};
type MyJob = { submission_id: number; task_id: number; platform: string; action: string; reward: number; status: string; proof: string | null; proof_url: string | null; reject_reason: string | null; target_url: string | null; evidence_type: string; vendor_name: string | null; created_at: string };
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
  { key: "withdraw", icon: "🏧", label: "Withdraw" },
  { key: "earners", icon: "🏆", label: "Top Earners" },
  { key: "support", icon: "🎫", label: "Support" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];
const PLATFORMS = ["All", "TikTok", "Instagram", "Facebook", "YouTube", "Threads", "Shopee"];
const ICON_KEY: Record<string, string> = { Facebook: "facebook", Threads: "threads", Instagram: "instagram", YouTube: "youtube", TikTok: "tiktok", Shopee: "shopee" };
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

  // top earners
  const [earnPeriod, setEarnPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [earners, setEarners] = useState<{ rank: number; name: string; jobs: number; earned: number }[]>([]);
  const [earnersLoading, setEarnersLoading] = useState(false);

  useEffect(() => {
    if (section !== "earners" || !supabase) return;
    (async () => {
      setEarnersLoading(true);
      const { data } = await supabase.rpc("top_earners", { p_period: earnPeriod });
      setEarners((data as typeof earners) ?? []);
      setEarnersLoading(false);
    })();
  }, [section, earnPeriod, supabase]);

  // job detail view (marketplace)
  const [jobDetail, setJobDetail] = useState<Job | null>(null);

  // submit-proof modal (for an accepted/pending job)
  const [submitTarget, setSubmitTarget] = useState<MyJob | null>(null);
  const [descText, setDescText] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // settings
  const [f, setF] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/log-masuk"; return; }
    const uid = auth.user.id;
    await supabase.rpc("release_abandoned"); // free abandoned slots before showing jobs
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
        bank_name: pr.bank_name ?? "", bank_account: pr.bank_account ?? "", tng_phone: pr.tng_phone ?? "",
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
    const { error } = await supabase.rpc("accept_job", { p_campaign_id: job.id });
    if (error) return flash("❌ " + error.message);
    flash("✅ Job accepted! Complete it, then submit your proof.");
    setJobDetail(null);
    await load();
    setSection("pending");
  }

  async function submitJobProof() {
    if (!supabase || !submitTarget) return;
    const isVideo = submitTarget.evidence_type === "video";
    if (!descText.trim()) return flash("⚠️ Add a description");
    const urls: string[] = [];
    setSubmitting(true);
    if (isVideo) {
      const v = videoUrl.trim();
      if (!/^https?:\/\/.+/.test(v)) { setSubmitting(false); return flash("⚠️ Paste a valid video URL (https://…)"); }
      urls.push(v);
    } else {
      if (proofFiles.length === 0) { setSubmitting(false); return flash("⚠️ Upload at least one screenshot"); }
      const { data: auth } = await supabase.auth.getUser();
      for (const f of proofFiles) {
        const compact = await compressImage(f);
        const ext = compact.name.split(".").pop() || "jpg";
        const path = `${auth.user!.id}/${submitTarget.task_id}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("proofs").upload(path, compact);
        if (upErr) { setSubmitting(false); return flash("❌ Upload failed: " + upErr.message); }
        urls.push(supabase.storage.from("proofs").getPublicUrl(path).data.publicUrl);
      }
    }
    const { error } = await supabase.rpc("submit_job", { p_sub_id: submitTarget.submission_id, p_desc: descText, p_proof_urls: urls });
    setSubmitting(false);
    if (error) return flash("❌ " + error.message);
    flash("✅ Submitted! Waiting for vendor review.");
    setSubmitTarget(null); setDescText(""); setProofFiles([]); setVideoUrl("");
    await load(); setSection("process");
  }

  async function saveSettings() {
    if (!supabase) return; setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, whatsapp: f.whatsapp, ic_number: f.ic_number, bank_name: f.bank_name, bank_account: f.bank_account,
      tng_phone: f.tng_phone,
      url_facebook: f.url_facebook, url_threads: f.url_threads, url_instagram: f.url_instagram, url_youtube: f.url_youtube, url_tiktok: f.url_tiktok,
    }).eq("id", auth.user!.id);
    setSaving(false);
    flash(error ? "❌ " + error.message : "✅ Settings saved"); if (!error) load();
  }

  const shownJobs = mpPlatform === "All" ? jobs : jobs.filter((j) => j.platform === mpPlatform);

  // 14-day earnings series (positive txns grouped by day)
  const earnSeries = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = txns.filter((t) => t.amount > 0 && t.created_at.slice(0, 10) === key)
        .reduce((a, t) => a + Number(t.amount), 0);
      days.push({ label: key.slice(5), total });
    }
    return days;
  }, [txns]);
  const earnMax = Math.max(0.01, ...earnSeries.map((d) => d.total));
  const jobCounts = useMemo(() => ({
    pending: myJobs.filter((j) => j.status === "accepted").length,
    review: myJobs.filter((j) => j.status === "pending").length,
    success: myJobs.filter((j) => j.status === "approved").length,
    rejected: myJobs.filter((j) => j.status === "rejected").length,
  }), [myJobs]);
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

  function JobTable({ rows, onApply }: { rows: Job[]; onApply: (j: Job) => void }) {
    if (rows.length === 0) return <p className="pj-card p-12 text-center text-slate-400">No jobs available right now. Check back soon 🙌</p>;
    return (
      <div className="pj-card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/10">
              <th className="px-5 py-3.5">Platform</th>
              <th className="px-5 py-3.5">Job</th>
              <th className="px-5 py-3.5">Vendor</th>
              <th className="px-5 py-3.5">Reward</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id} className="group border-b border-slate-50 transition last:border-0 hover:bg-brand-50/40 dark:border-white/5 dark:hover:bg-white/5">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {j.vendor_logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={j.vendor_logo} alt="" className="h-9 w-9 rounded-xl border border-slate-200 object-cover dark:border-white/10" /> : ICON_KEY[j.platform] ? <PlatformIcon name={ICON_KEY[j.platform]} size={36} /> : <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 dark:bg-white/5">⭐</span>}
                    <span className="hidden text-xs font-medium text-slate-500 sm:block">{j.platform}</span>
                  </div>
                </td>
                <td className="max-w-[220px] truncate px-5 py-3.5 font-semibold">{j.title}</td>
                <td className="px-5 py-3.5 text-slate-500">{j.vendor_name}</td>
                <td className="px-5 py-3.5 font-extrabold text-gradient">{rm(j.reward)}</td>
                <td className="px-5 py-3.5 text-slate-500">{j.taken}/{j.quota}</td>
                <td className="px-5 py-3.5"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/10">Available</span></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => onApply(j)} className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-sm font-bold transition hover:border-transparent hover:bg-brand-gradient hover:text-white hover:shadow-glow-sm dark:border-white/10" title="Take job">+</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
                      <button onClick={() => { setSubmitTarget(j); setDescText(""); setProofFiles([]); setVideoUrl(""); }} className="pj-btn-primary px-4 py-2">Submit Proof</button>
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
          {/* avatar */}
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50/80 p-4 text-center dark:bg-white/5">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-xl font-extrabold text-white shadow-glow-sm">
              {(profile?.full_name || "U").trim().charAt(0).toUpperCase()}
            </div>
            <p className="mt-2 max-w-full truncate text-sm font-bold">{profile?.full_name || "User"}</p>
            <p className="text-xs text-slate-400">Level {profile?.level ?? 1} · {profile?.xp ?? 0} XP</p>
          </div>
          <nav className="mt-4 space-y-1">
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
              {/* top row — charts (reference layout) */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* earnings chart — single series, brand hue */}
                <div className="pj-card p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Earnings · last 14 days</p>
                  <p className="mt-1 text-2xl font-extrabold text-gradient">{rm(earnSeries.reduce((a, d) => a + d.total, 0))}</p>
                  <div className="mt-4 flex h-20 items-end gap-[3px]">
                    {earnSeries.map((d) => (
                      <div key={d.label} className="group relative flex-1">
                        <div
                          className="w-full rounded-t bg-brand-500/90 transition group-hover:bg-brand-600"
                          style={{ height: `${Math.max(3, (d.total / earnMax) * 72)}px` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block dark:bg-white dark:text-slate-900">
                          {d.label} · {rm(d.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{earnSeries[0]?.label}</span><span>{earnSeries[13]?.label}</span></div>
                </div>

                {/* jobs by status */}
                <div className="pj-card p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jobs Overview</p>
                  <p className="mt-1 text-2xl font-extrabold">{myJobs.length} <span className="text-sm font-semibold text-slate-400">total</span></p>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { l: "Pending", v: jobCounts.pending, cls: "bg-slate-400" },
                      { l: "In Review", v: jobCounts.review, cls: "bg-amber-500" },
                      { l: "Success", v: jobCounts.success, cls: "bg-brand-500" },
                      { l: "Rejected", v: jobCounts.rejected, cls: "bg-rose-500" },
                    ].map((s) => (
                      <div key={s.l} className="flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} />
                        <span className="text-slate-600 dark:text-slate-300">{s.l}</span>
                        <span className="ml-auto font-bold">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* available jobs preview (reference table) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold tracking-tight">Available Jobs</h2>
                  <button onClick={() => setSection("marketplace")} className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">View all →</button>
                </div>
                <JobTable rows={jobs.slice(0, 6)} onApply={acceptJob} />
              </div>
            </div>
          )}

          {section === "marketplace" && !jobDetail && (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => setMpPlatform(p)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${mpPlatform === p ? "bg-brand-gradient text-white shadow-glow-sm" : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>
                    {ICON_KEY[p] && <PlatformIcon name={ICON_KEY[p]} size={20} />}{p}
                  </button>
                ))}
              </div>
              {shownJobs.length === 0 ? <p className="pj-card p-12 text-center text-slate-400">No {mpPlatform !== "All" ? mpPlatform : ""} jobs right now. Check back soon 🙌</p> : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {shownJobs.map((j) => (
                    <div key={j.id} className="pj-card pj-card-hover flex flex-col p-5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {ICON_KEY[j.platform] && <PlatformIcon name={ICON_KEY[j.platform]} size={16} />}{j.platform}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">Available</span>
                      </div>
                      <p className="mt-3 text-[11px] font-semibold text-slate-400">#{j.id}</p>
                      <h3 className="mt-0.5 line-clamp-2 font-bold leading-snug">{j.title}</h3>
                      {j.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{j.description}</p>}
                      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                        <span>💰 <b className="text-gradient">{rm(j.reward)}</b></span>
                        <span>⏱️ {j.duration_min ? `${j.duration_min} min` : "—"}</span>
                        <span>👥 Slot: {j.taken}/{j.quota}</span>
                        <span>{j.evidence_type === "video" ? "🎬 Video" : "📷 Image"}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">🕐 {new Date(j.created_at).toLocaleString("en-MY", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "numeric", minute: "2-digit" })}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => setJobDetail(j)} className="pj-btn-ghost py-2.5">View Details</button>
                        <button onClick={() => acceptJob(j)} className="pj-btn-primary py-2.5">Take Job</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "marketplace" && jobDetail && (
            <div>
              <button onClick={() => setJobDetail(null)} className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">← Back</button>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {ICON_KEY[jobDetail.platform] && <PlatformIcon name={ICON_KEY[jobDetail.platform]} size={16} />}{jobDetail.platform}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">Available</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-400">#{jobDetail.id} · by {jobDetail.vendor_name}</p>
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{jobDetail.title}</h1>
                    {jobDetail.target_url && (
                      <a href={jobDetail.target_url} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10">
                        ↗ Open Job Link
                      </a>
                    )}
                  </div>
                  <div className="pj-card p-6">
                    <h2 className="font-bold">Job Instructions</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{jobDetail.description || "Follow the job link and complete the action, then submit your proof."}</p>
                  </div>
                  {jobDetail.example_urls?.length > 0 && (
                    <div className="pj-card p-6">
                      <h2 className="font-bold">📷 Accepted Proof Examples</h2>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {jobDetail.example_urls.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={i} href={u} target="_blank"><img src={u} alt={`Example ${i + 1}`} className="h-32 w-full rounded-xl border border-slate-200 object-cover dark:border-white/10" /></a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="pj-card p-5">
                    {[
                      ["💰 Reward", <b key="r" className="text-gradient">{rm(jobDetail.reward)}</b>],
                      ["👥 Participants", `${jobDetail.taken} / ${jobDetail.quota}`],
                      ["⏱️ Est. Time", jobDetail.duration_min ? `${jobDetail.duration_min} min` : "—"],
                      ["📄 Proof Type", jobDetail.evidence_type === "video" ? "Video" : "Image"],
                      ["🔁 Claim", jobDetail.claim_mode === "multi" ? `Up to ${jobDetail.per_user_quota}× per user` : "One time per user"],
                      ...(jobDetail.deadline ? [["📅 Deadline", new Date(jobDetail.deadline).toLocaleString("en-MY")]] as [string, string][] : []),
                    ].map(([k, v], i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-white/5">
                        <span className="text-slate-500">{k}</span><span className="font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => acceptJob(jobDetail)} className="pj-btn-primary w-full py-3.5 text-base">Take This Job</button>
                </div>
              </div>
            </div>
          )}

          {section === "pending" && <JobList status="accepted" withDate={false} showSubmit />}
          {section === "process" && <JobList status="pending" withDate />}
          {section === "success" && <JobList status="approved" withDate />}
          {section === "rejected" && <JobList status="rejected" withDate />}

          {section === "wallet" && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500">Summary of your balance and wallet transactions.</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { l: "Reward Balance", v: rm(wsum?.balance ?? profile?.wallet_balance), d: "Available to withdraw", hot: true },
                  { l: "Pending Review", v: rm(myJobs.filter((j) => j.status === "pending").reduce((a, j) => a + Number(j.reward), 0)), d: "Jobs awaiting vendor review" },
                  { l: "Total Earned", v: rm(wsum?.total_commission), d: "All approved earnings" },
                  { l: "Total Withdrawn", v: rm(wsum?.total_withdrawn), d: "Paid out to your bank" },
                ].map((s) => (
                  <div key={s.l} className={`pj-card p-5 ${s.hot ? "ring-1 ring-brand-300/60" : ""}`}>
                    <p className="text-xs font-semibold text-slate-500">{s.l}</p>
                    <p className={`mt-1.5 text-2xl font-extrabold ${s.hot ? "text-gradient" : ""}`}>{s.v}</p>
                    <p className="mt-1 text-xs text-slate-400">{s.d}</p>
                  </div>
                ))}
              </div>
              {(wsum?.pending_withdrawal ?? 0) > 0 && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  ⏳ {rm(wsum?.pending_withdrawal)} withdrawal pending admin approval.
                </div>
              )}
              <div className="pj-card overflow-hidden p-0">
                <p className="border-b border-slate-100 px-5 py-3.5 font-bold dark:border-white/10">Transaction History</p>
                {txns.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No transactions yet.</p> : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {txns.map((x) => (
                      <li key={x.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">{x.note ?? x.kind}</p>
                          <p className="text-xs text-slate-400">{new Date(x.created_at).toLocaleString("en-MY")}</p>
                        </div>
                        <span className={`font-bold ${x.amount >= 0 ? "text-brand-600" : "text-rose-500"}`}>{x.amount >= 0 ? "+" : ""}{rm(x.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {section === "withdraw" && (
            <div className="mx-auto max-w-2xl space-y-5">
              <p className="text-sm text-slate-500">Request a payout from your wallet (Reward Balance: <b className="text-brand-600">{rm(wsum?.balance ?? profile?.wallet_balance)}</b>)</p>

              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-5 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <p className="font-bold">ℹ️ Withdrawal Policy</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Minimum withdrawal: <b>RM 1.00</b></li>
                  <li>Payment via <b>Touch &#39;n Go eWallet</b> only</li>
                  <li>Upload your TNG QR image — we scan it to pay you</li>
                  <li>Processing takes <b>1–3 working days</b></li>
                  <li>Only approved job earnings &amp; commissions can be withdrawn</li>
                </ul>
              </div>

              <div className="pj-card p-6">
                <h2 className="font-bold">Withdrawal Form</h2>
                <p className="mt-4 text-sm font-medium">Withdrawal Amount</p>
                <div className="mt-1 rounded-2xl bg-slate-50 p-6 text-center dark:bg-white/5">
                  <p className="text-3xl font-extrabold text-gradient">{rm(wsum?.balance ?? profile?.wallet_balance)}</p>
                  <p className="mt-1 text-xs text-slate-400">Your entire Reward Balance will be withdrawn</p>
                </div>
                {Number(wsum?.balance ?? 0) < 1 && <p className="mt-2 text-sm text-rose-500">A minimum balance of RM 1.00 is required to withdraw.</p>}

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-bold">Touch &#39;n Go Details</p>
                  {inp("full_name", "Full Name (as per IC)")}
                  {inp("ic_number", "IC Number", "e.g. 900101-01-1234")}
                  {inp("tng_phone", "TNG Phone Number", "e.g. 0123456789")}
                  <div>
                    <label className="block text-sm font-medium">TNG QR Image</label>
                    <p className="text-xs text-slate-400">Upload a screenshot of your TNG eWallet QR code</p>
                    <label className="mt-1 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 transition hover:border-brand-400 dark:border-white/10">
                      {qrFile ? <span className="font-semibold text-brand-600">✓ {qrFile.name} (auto-compressed)</span>
                        : profile?.tng_qr_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.tng_qr_url} alt="TNG QR" className="mx-auto max-h-40 rounded-xl" />
                        ) : <>🖼️ Click to upload your TNG QR<br /><span className="text-xs">PNG, JPG</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!supabase) return;
                    const bal = Number(wsum?.balance ?? profile?.wallet_balance ?? 0);
                    if (bal < 1) return flash("⚠️ Minimum RM 1.00 required to withdraw.");
                    if (!f.full_name || !f.ic_number || !f.tng_phone) return flash("⚠️ Complete Full Name, IC & TNG phone first.");
                    if (qrFile) {
                      const compact = await compressImage(qrFile);
                      const { data: auth } = await supabase.auth.getUser();
                      const path = `${auth.user!.id}/tng-qr.jpg`;
                      const { error: upErr } = await supabase.storage.from("qr").upload(path, compact, { upsert: true });
                      if (upErr) return flash("❌ QR upload failed: " + upErr.message);
                      const url = supabase.storage.from("qr").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
                      await supabase.from("profiles").update({ tng_qr_url: url }).eq("id", auth.user!.id);
                    }
                    await saveSettings();
                    const { error } = await supabase.rpc("request_withdrawal", { p_amount: bal, p_method: `TNG ${f.tng_phone}` });
                    flash(error ? "❌ " + error.message : "✅ Request submitted. Payment via TNG within 1–3 working days.");
                    if (!error) { setQrFile(null); load(); }
                  }}
                  disabled={Number(wsum?.balance ?? 0) < 1}
                  className="pj-btn-primary mt-5 w-full py-3.5 disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>

              <div className="pj-card overflow-hidden p-0">
                <p className="border-b border-slate-100 px-5 py-3.5 font-bold dark:border-white/10">Withdrawal History</p>
                {wds.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No withdrawal history.</p> : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {wds.map((w) => (
                      <li key={w.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                        <div><p className="font-semibold">{rm(w.amount)}</p><p className="text-xs text-slate-400">{w.method} · {new Date(w.created_at).toLocaleString("en-MY")}</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${w.status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : w.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{w.status === "paid" ? "Paid" : w.status === "rejected" ? "Rejected" : "Pending"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {section === "earners" && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 flex justify-center gap-2">
                {(["daily", "weekly", "monthly"] as const).map((p) => (
                  <button key={p} onClick={() => setEarnPeriod(p)} className={`rounded-full px-5 py-2 text-sm font-bold capitalize transition ${earnPeriod === p ? "bg-brand-gradient text-white shadow-glow-sm" : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>{p}</button>
                ))}
              </div>
              {earnersLoading ? (
                <p className="pj-card p-12 text-center text-slate-400">Loading…</p>
              ) : earners.length === 0 ? (
                <div className="pj-card p-12 text-center">
                  <p className="text-4xl">🏆</p>
                  <p className="mt-3 font-semibold">No earnings recorded {earnPeriod === "daily" ? "today" : `this ${earnPeriod.replace("ly", "")}`} yet.</p>
                  <p className="mt-1 text-sm text-slate-500">Complete jobs to claim the top spot!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {earners.map((e, i) => (
                    <div key={e.rank} className={`pj-card flex items-center gap-4 p-4 ${i < 3 ? "ring-1 ring-brand-300/50" : ""}`}>
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg font-bold dark:bg-white/5">
                        {["🥇", "🥈", "🥉"][i] ?? <span className="text-slate-400">{e.rank}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{e.name}</p>
                        <p className="text-xs text-slate-500">{e.jobs} jobs completed</p>
                      </div>
                      <p className="font-extrabold text-gradient">{rm(e.earned)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "support" && supabase && (
            <TicketCenter mode="client" supabase={supabase} jobs={myJobs.map((j) => ({ submission_id: j.submission_id, action: j.action, platform: j.platform }))} withdrawals={wds.map((w) => ({ id: w.id, amount: w.amount, status: w.status }))} />
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
                <h2 className="text-lg font-semibold">👤 Account</h2>
                <div className="mt-4 space-y-3">
                  {inp("full_name", "Full Name")}
                  {inp("whatsapp", "Phone Number")}
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5">🏦 Bank details for payout are managed on the <b>Withdraw</b> page.</div>
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
            {submitTarget.evidence_type === "video" ? (
              <div className="mt-4">
                <label className="block text-sm font-medium">Video URL *</label>
                <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/@you/video/…" className="mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
                <p className="mt-1 text-xs text-slate-400">Paste the link to your posted video as proof.</p>
              </div>
            ) : (
              <div className="mt-4">
                <label className="block text-sm font-medium">Screenshot proof(s) *</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setProofFiles(Array.from(e.target.files ?? []))} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />
                {proofFiles.length > 0 && <p className="mt-1 text-xs text-brand-500">✓ {proofFiles.length} image(s) selected (auto-compressed)</p>}
              </div>
            )}
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
