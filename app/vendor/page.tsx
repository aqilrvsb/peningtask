"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/site";
import { PlatformIcon } from "@/components/icons";
import { TicketCenter } from "@/components/tickets";
import { compressImage } from "@/lib/compress";
import { formatDuration, klISO } from "@/lib/duration";
import { createClient, hasSupabase } from "@/lib/supabase";

type Campaign = {
  id: number; platform: string; title: string | null; quantity: number; delivered: number;
  reward_each: number; fee_pct: number; deadline: string | null; starts_at: string | null; all_day: boolean; expired: boolean;
  invoice: number; invoice_fee: number; invoice_total: number;
  payment_status: string; receipt_url: string | null; admin_reject_reason: string | null; created_at: string;
};
type Sub = {
  id: number; task_id: number; job_title: string; platform: string; reward: number;
  client_name: string | null; client_profile_url: string | null; description: string | null;
  proof_urls: string[] | null; evidence_type: string; created_at: string;
};

const NAV = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "create", icon: "➕", label: "Create Job" },
  { key: "review", icon: "🔍", label: "Review Submissions" },
  { key: "jobs", icon: "📋", label: "My Jobs" },
  { key: "support", icon: "🎫", label: "Support" },
  { key: "brand", icon: "🏷️", label: "Brand" },
];
const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "Threads", "Shopee"];
const ICON_KEY: Record<string, string> = { Facebook: "facebook", Threads: "threads", Instagram: "instagram", YouTube: "youtube", TikTok: "tiktok", Shopee: "shopee" };

function rm(n: unknown) { return "RM " + Number(n || 0).toFixed(2); }

export default function VendorPanel() {
  const supabase = useMemo(() => (hasSupabase ? createClient() : null), []);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [section, setSection] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);

  // brand
  const [bizName, setBizName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);

  // create-job form
  const [platform, setPlatform] = useState("TikTok");
  const [jobName, setJobName] = useState("");
  const [reward, setReward] = useState(0.1);
  const [count, setCount] = useState(20);
  // duration (Kuala Lumpur timezone)
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeMode, setTimeMode] = useState<"allday" | "time">("allday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [durationMin, setDurationMin] = useState(5);
  const [evidenceType, setEvidenceType] = useState<"image" | "video">("image");
  const [claimMode, setClaimMode] = useState<"once" | "multi">("once");
  const [perUserQuota, setPerUserQuota] = useState(2);
  const [autoRelease, setAutoRelease] = useState(6);
  const [instructions, setInstructions] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [exampleFiles, setExampleFiles] = useState<File[]>([]);
  const [feePct, setFeePct] = useState(20);
  const [busy, setBusy] = useState(false);

  const total = Math.round(reward * count * 100) / 100;
  const fee = Math.round(total * feePct) / 100;
  const charge = Math.round((total + fee) * 100) / 100;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/log-masuk"; return; }
    const { data: prof } = await supabase.from("profiles").select("role,business_name,avatar_url,vendor_approved").eq("id", auth.user.id).single();
    if (!prof || !["vendor", "admin"].includes(prof.role)) { setAllowed(false); return; }
    if (prof.role === "vendor" && !prof.vendor_approved) { setAllowed(false); setPending(true); setBizName(prof.business_name ?? ""); return; }
    setAllowed(true);
    setBizName(prof.business_name ?? "");
    setLogoUrl(prof.avatar_url ?? null);
    await supabase.rpc("release_abandoned");
    const [c, s, fp] = await Promise.all([
      supabase.rpc("vendor_my_jobs"),
      supabase.rpc("vendor_pending_submissions"),
      supabase.rpc("get_fee_pct"),
    ]);
    setCampaigns((c.data as Campaign[]) ?? []);
    setSubs((s.data as Sub[]) ?? []);
    if (typeof fp.data === "number") setFeePct(fp.data);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function createJob() {
    if (!supabase) return;
    if (!jobName.trim()) return flash("⚠️ Enter the job name");
    if (!instructions.trim()) return flash("⚠️ Write the job instructions");
    // --- duration (Kuala Lumpur) ---
    if (!startDate) return flash(dateMode === "range" ? "⚠️ Set the start date" : "⚠️ Set the job date");
    const eDate = dateMode === "single" ? startDate : endDate;
    if (dateMode === "range" && !eDate) return flash("⚠️ Set the end date");
    const allDay = timeMode === "allday";
    const startsAtISO = klISO(startDate, allDay ? "00:00" : startTime);
    const deadlineISO = klISO(eDate, allDay ? "23:59" : endTime);
    const startsAt = new Date(startsAtISO), endsAt = new Date(deadlineISO);
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return flash("⚠️ Invalid date/time");
    if (endsAt <= new Date()) return flash("⚠️ Duration end must be in the future");
    if (endsAt < startsAt) return flash("⚠️ End must be after the start");
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const exampleUrls: string[] = [];
    for (const fl of exampleFiles) {
      const compact = await compressImage(fl);
      const ext = compact.name.split(".").pop() || "jpg";
      const path = `${auth.user!.id}/${crypto.randomUUID().slice(0, 10)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("examples").upload(path, compact);
      if (upErr) { setBusy(false); return flash("❌ Example upload failed: " + upErr.message); }
      exampleUrls.push(supabase.storage.from("examples").getPublicUrl(path).data.publicUrl);
    }
    const { error } = await supabase.rpc("vendor_create_job", {
      p_platform: platform, p_title: jobName, p_reward: reward, p_quota: count,
      p_evidence_type: evidenceType, p_claim_mode: claimMode,
      p_per_user_quota: claimMode === "multi" ? perUserQuota : 1,
      p_duration_min: durationMin || null,
      p_deadline: deadlineISO,
      p_instructions: instructions, p_target_url: targetUrl || null, p_example_urls: exampleUrls,
      p_auto_release_hours: autoRelease,
      p_starts_at: startsAtISO, p_all_day: allDay,
    });
    setBusy(false);
    if (error) return flash("❌ " + error.message);
    flash("✅ Job is now live on the marketplace!");
    setJobName(""); setInstructions(""); setTargetUrl(""); setExampleFiles([]); setStartDate(""); setEndDate("");
    load(); setSection("jobs");
  }

  async function submitReceipt(cid: number, file: File) {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    const f = file.type.startsWith("image/") ? await compressImage(file) : file;
    const ext = f.name.split(".").pop() || "pdf";
    const path = `${auth.user!.id}/receipt-${cid}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("receipts").upload(path, f);
    if (upErr) return flash("❌ Upload failed: " + upErr.message);
    const url = supabase.storage.from("receipts").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.rpc("vendor_submit_receipt", { p_cid: cid, p_receipt_url: url });
    if (error) return flash("❌ " + error.message);
    flash("✅ Receipt submitted — awaiting admin verification.");
    load();
  }

  async function decide(id: number, ok: boolean) {
    if (!supabase) return;
    let reason = "";
    if (!ok) {
      reason = prompt("Rejection reason (e.g. fake proof / invalid account / scam):") ?? "";
      if (reason === "") return;
    }
    const { error } = ok
      ? await supabase.rpc("approve_submission", { p_sub_id: id })
      : await supabase.rpc("reject_submission", { p_sub_id: id, p_reason: reason });
    if (error) return flash("❌ " + error.message);
    flash(ok ? "✅ Approved — worker paid from escrow" : "Submission rejected");
    load();
  }

  async function saveBrand() {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setSavingBrand(true);
    let url = logoUrl;
    if (logoFile) {
      const compact = await compressImage(logoFile, 512, 0.85);
      const ext = compact.name.split(".").pop() || "jpg";
      const path = `${auth.user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("logos").upload(path, compact, { upsert: true });
      if (upErr) { setSavingBrand(false); return flash("❌ Logo upload failed: " + upErr.message); }
      url = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
    }
    const { error } = await supabase.from("profiles").update({ business_name: bizName || null, avatar_url: url }).eq("id", auth.user.id);
    setSavingBrand(false);
    if (error) return flash("❌ " + error.message);
    setLogoUrl(url); setLogoFile(null);
    flash("✅ Brand saved — your logo now shows on every job");
  }

  const dueCount = campaigns.filter((c) => c.expired && c.delivered > 0 && c.payment_status !== "paid").length;
  const activeLabel = NAV.find((n) => n.key === section)?.label ?? "";

  if (pending)
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="pj-card max-w-md p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-500/15">⏳</div>
          <h1 className="mt-4 text-xl font-extrabold">Waiting for Admin Approval</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thanks for registering{bizName ? `, ${bizName}` : ""}! Your vendor account is under review. You&apos;ll be notified once an admin approves it — then all vendor features unlock.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => load()} className="pj-btn-ghost py-2.5">🔄 Check status</button>
            <button onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/log-masuk"; }} className="text-sm text-slate-500 hover:underline">Log out</button>
          </div>
        </div>
      </div>
    );

  if (allowed === false)
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="pj-card max-w-md p-8 text-center">
          <p className="text-3xl">📣</p>
          <h1 className="mt-3 text-xl font-bold">Vendor Panel</h1>
          <p className="mt-2 text-sm text-slate-500">Your account is not a vendor yet. Contact admin to upgrade.</p>
          <Link href="/dashboard" className="pj-btn-primary mt-5 inline-flex px-6 py-2.5">← Back to Dashboard</Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className={`${navOpen ? "block" : "hidden"} border-r border-slate-200/70 bg-white/70 backdrop-blur lg:block lg:w-60 lg:shrink-0 dark:border-white/10 dark:bg-slate-950/60`}>
        <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded-md bg-brand-gradient px-2 py-0.5 text-[10px] font-bold text-white">VENDOR</span>
          </div>
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50/80 p-4 text-center dark:bg-white/5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-full border border-slate-200 object-cover dark:border-white/10" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-xl font-extrabold text-white shadow-glow-sm">
                {(bizName || "V").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <p className="mt-2 max-w-full truncate text-sm font-bold">{bizName || "Your Brand"}</p>
            <p className="text-xs text-slate-400">Vendor account</p>
          </div>
          <nav className="mt-4 space-y-1">
            {NAV.map((it) => (
              <button key={it.key} onClick={() => { setSection(it.key); setNavOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${section === it.key ? "bg-brand-gradient text-white shadow-glow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                <span className="text-base">{it.icon}</span>{it.label}
                {it.key === "review" && subs.length > 0 && <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{subs.length}</span>}
              </button>
            ))}
          </nav>
          <Link href="/dashboard" className="mt-6 block rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">← Client Dashboard</Link>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <header className="pj-glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden dark:border-white/10">☰</button>
            <h1 className="text-lg font-extrabold tracking-tight">{activeLabel}</h1>
          </div>
          <button onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/log-masuk"; }} className="pj-btn-ghost px-3.5 py-2">Log Out</button>
        </header>

        <div className="p-4 lg:p-8">
          {allowed === null ? <p className="py-24 text-center text-slate-400">Loading…</p> : (
          <>
          {section === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold">Welcome, {bizName || "Vendor"} 👋</h2>
                <p className="text-slate-500">Publish engagement jobs, review proofs, pay after each campaign.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { l: "Active Jobs", v: campaigns.filter((c) => !c.expired).length, icon: "📋" },
                  { l: "Pending Review", v: subs.length, icon: "🔍", hot: subs.length > 0 },
                  { l: "Payment Due", v: dueCount, icon: "🧾", hot: dueCount > 0 },
                  { l: "Fee Rate", v: `${feePct}%`, icon: "⚙️" },
                ].map((s) => (
                  <div key={s.l} className={`pj-card p-5 ${s.hot ? "ring-1 ring-amber-300" : ""}`}>
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{s.l}</p><span className="text-lg">{s.icon}</span></div>
                    <p className="mt-2 text-2xl font-extrabold">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="pj-card p-6">
                <h2 className="text-lg font-semibold">How it works 📣</h2>
                <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>1️⃣ <b>Create a job</b> — set quota, reward &amp; expiry date. It goes live instantly (free).</li>
                  <li>2️⃣ Community members complete it &amp; submit proof</li>
                  <li>3️⃣ <b>Review proofs</b> — approve (workers get paid) or reject with a reason</li>
                  <li>4️⃣ After expiry, an <b>invoice</b> is generated (delivered × reward + {feePct}% fee) — upload your receipt &amp; admin verifies</li>
                </ol>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setSection("create")} className="pj-btn-primary px-5 py-2.5">+ Create Job</button>
                  <button onClick={() => setSection("review")} className="pj-btn-ghost px-5 py-2.5">🔍 Review ({subs.length})</button>
                </div>
              </div>
            </div>
          )}

          {section === "create" && (
            <div className="pj-card max-w-2xl p-6">
              <h2 className="text-lg font-semibold">Create New Job</h2>
              <label className="mt-4 block text-sm font-medium">Job Name *</label>
              <input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Follow account & like 3 latest posts" className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Platform *</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5">
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Quota (slots) *</label>
                  <input type="number" min="1" max="1000" value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Amount / job (RM) *</label>
                  <input type="number" step="0.01" min="0.01" value={reward} onChange={(e) => setReward(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Est. Duration (minutes)</label>
                  <input type="number" min="1" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <label className="block text-sm font-medium">Duration *</label>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10">🕐 Timezone: Kuala Lumpur (GMT+8)</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {([["single", "📅 Single date"], ["range", "🗓️ Date range"]] as const).map(([k, l]) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold ${dateMode === k ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>
                    <input type="radio" name="datemode" checked={dateMode === k} onChange={() => setDateMode(k)} className="accent-pink-600" />{l}
                  </label>
                ))}
              </div>
              <div className={`mt-2 grid gap-2 ${dateMode === "range" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="block text-xs text-slate-500">{dateMode === "range" ? "Start date" : "Date"}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                </div>
                {dateMode === "range" && (
                  <div>
                    <label className="block text-xs text-slate-500">End date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([["allday", "🌤️ All day"], ["time", "⏰ Specific time"]] as const).map(([k, l]) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold ${timeMode === k ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>
                    <input type="radio" name="timemode" checked={timeMode === k} onChange={() => setTimeMode(k)} className="accent-pink-600" />{l}
                  </label>
                ))}
              </div>
              {timeMode === "time" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500">Start time</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500">End time</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">After the end date the job leaves the marketplace and an invoice is generated for the work delivered.</p>
              <label className="mt-4 block text-sm font-medium">Evidence Type *</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {([["image", "📷 By Images"], ["video", "🎬 By Video URL"]] as const).map(([k, l]) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold ${evidenceType === k ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>
                    <input type="radio" name="evidence" checked={evidenceType === k} onChange={() => setEvidenceType(k)} className="accent-pink-600" />{l}
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-sm font-medium">Job Type *</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 text-sm ${claimMode === "once" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>
                  <input type="radio" name="claim" checked={claimMode === "once"} onChange={() => setClaimMode("once")} className="mt-0.5 accent-pink-600" />
                  <span><b>One Time</b><br /><span className="text-xs text-slate-500">Each user can claim this job once only</span></span>
                </label>
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 text-sm ${claimMode === "multi" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>
                  <input type="radio" name="claim" checked={claimMode === "multi"} onChange={() => setClaimMode("multi")} className="mt-0.5 accent-pink-600" />
                  <span><b>Multi Claim</b><br /><span className="text-xs text-slate-500">One user can retake this job multiple times</span></span>
                </label>
              </div>
              {claimMode === "multi" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium">Max claims per user *</label>
                  <input type="number" min="2" value={perUserQuota} onChange={(e) => setPerUserQuota(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" />
                </div>
              )}
              <label className="mt-4 block text-sm font-medium">Auto-release slot after (hours)</label>
              <input type="number" min="1" value={autoRelease} onChange={(e) => setAutoRelease(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <p className="mt-1 text-xs text-slate-400">If a worker takes a slot but doesn&apos;t submit proof within this time, the slot returns to the marketplace.</p>

              <label className="mt-4 block text-sm font-medium">Job Link (target URL)</label>
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://www.tiktok.com/@your_account" className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <label className="mt-4 block text-sm font-medium">Instructions *</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} placeholder={"1. Open the job link\n2. Follow the account\n3. Screenshot as proof"} className="mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
              <label className="mt-4 block text-sm font-medium">Evidence Examples (images, optional)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setExampleFiles(Array.from(e.target.files ?? []))} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />
              {exampleFiles.length > 0 && <p className="mt-1 text-xs text-brand-500">✓ {exampleFiles.length} image(s) selected (auto-compressed)</p>}
              <div className="mt-5 space-y-1 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
                <p className="mb-1 font-bold">Estimated quotation (max)</p>
                <div className="flex justify-between"><span className="text-slate-500">Rewards ({count} × {rm(reward)})</span><span>{rm(total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Platform fee ({feePct}%)</span><span>{rm(fee)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold dark:border-white/10"><span>Max total</span><span className="text-brand-600">{rm(charge)}</span></div>
                <p className="pt-1 text-xs text-slate-400">💡 Post-paid: you only pay for jobs actually completed. Final invoice is generated after the expiry date.</p>
              </div>
              <button onClick={createJob} disabled={busy} className="pj-btn-primary mt-4 w-full py-3">
                {busy ? "Publishing…" : "Publish Job (free — pay after expiry)"}
              </button>
            </div>
          )}

          {section === "review" && (
            <div className="space-y-3">
              {subs.length === 0 && <p className="pj-card p-12 text-center text-slate-400">No proofs awaiting review ✅</p>}
              {subs.map((s) => (
                <div key={s.id} className="pj-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {ICON_KEY[s.platform] && <PlatformIcon name={ICON_KEY[s.platform]} size={32} />}
                        <div>
                          <p className="font-bold">{s.job_title}</p>
                          <p className="text-xs text-slate-500">Reward {rm(s.reward)} · {new Date(s.created_at).toLocaleString("en-MY")}</p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                        <p><b>👤 {s.client_name || "Client"}</b>{s.client_profile_url && <> · <a href={s.client_profile_url} target="_blank" className="font-semibold text-brand-600 hover:underline">Verify {s.platform} profile ↗</a></>}</p>
                        {s.description && <p className="mt-1.5 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{s.description}</p>}
                      </div>
                      {(s.proof_urls?.length ?? 0) > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {s.proof_urls!.map((u, i) =>
                            s.evidence_type === "video" || !/\.(jpe?g|png|webp|gif)($|\?)/i.test(u) && u.startsWith("http") && !u.includes("/storage/") ? (
                              <a key={i} href={u} target="_blank" className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10">▶ Watch video proof ↗</a>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <a key={i} href={u} target="_blank"><img src={u} alt={`Proof ${i + 1}`} className="h-36 rounded-xl border border-slate-200 object-cover dark:border-white/10" /></a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => decide(s.id, true)} className="pj-btn-primary px-4 py-2">Approve &amp; Pay</button>
                      <button onClick={() => decide(s.id, false)} className="pj-btn-ghost px-4 py-2">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "jobs" && (
            <div className="pj-card overflow-x-auto p-0">
              {campaigns.length === 0 ? <p className="p-10 text-center text-slate-400">No jobs yet. Create your first job!</p> : (
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/10">
                      <th className="px-5 py-3.5">Job</th><th className="px-5 py-3.5">Platform</th><th className="px-5 py-3.5">Progress</th>
                      <th className="px-5 py-3.5">Duration (KL)</th><th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.filter((c) => !c.expired).map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                        <td className="max-w-[220px] truncate px-5 py-3.5 font-semibold">{c.title || `Job #${c.id}`}</td>
                        <td className="px-5 py-3.5"><span className="flex w-fit items-center gap-1.5">{ICON_KEY[c.platform] && <PlatformIcon name={ICON_KEY[c.platform]} size={22} />}{c.platform}</span></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-brand-gradient" style={{ width: `${Math.min(100, (c.delivered / c.quantity) * 100)}%` }} /></div>
                            <span className="text-xs text-slate-500">{c.delivered}/{c.quantity}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{formatDuration(c.starts_at, c.deadline, c.all_day)}</td>
                        <td className="px-5 py-3.5"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10">Live</span></td>
                      </tr>
                    ))}
                    {campaigns.filter((c) => !c.expired).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-400">No active jobs.</td></tr>}
                  </tbody>
                </table>
              )}

              {campaigns.some((c) => c.expired) && (
                <div className="mt-6">
                  <h2 className="text-lg font-bold">🧾 Expired Jobs — Payment Due</h2>
                  <p className="text-sm text-slate-500">Attach your payment receipt (PDF/image) for the invoice below. Admin will verify.</p>
                  <div className="mt-3 space-y-3">
                    {campaigns.filter((c) => c.expired).map((c) => (
                      <div key={c.id} className="pj-card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-bold">{c.title} <span className="text-xs font-normal text-slate-400">· {c.platform} · {c.delivered}/{c.quantity} completed</span></p>
                            <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                              <div className="flex justify-between gap-8"><span className="text-slate-500">Delivered ({c.delivered} × {rm(c.reward_each)})</span><span>{rm(c.invoice)}</span></div>
                              <div className="flex justify-between gap-8"><span className="text-slate-500">Platform fee ({c.fee_pct}%)</span><span>{rm(c.invoice_fee)}</span></div>
                              <div className="mt-1 flex justify-between gap-8 border-t border-slate-200 pt-1 font-bold dark:border-white/10"><span>Invoice Total</span><span className="text-brand-600">{rm(c.invoice_total)}</span></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${c.payment_status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : c.payment_status === "submitted" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"}`}>
                              {c.payment_status === "paid" ? "✅ Paid" : c.payment_status === "submitted" ? "⏳ Awaiting verification" : "Payment due"}
                            </span>
                            {c.admin_reject_reason && <p className="mt-1 text-xs text-rose-500">Rejected: {c.admin_reject_reason}</p>}
                            {c.payment_status !== "paid" && c.payment_status !== "submitted" && (
                              <label className="mt-3 block cursor-pointer rounded-xl bg-brand-gradient px-4 py-2 text-center text-sm font-bold text-white">
                                📎 Upload Receipt
                                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const fx = e.target.files?.[0]; if (fx) submitReceipt(c.id, fx); }} />
                              </label>
                            )}
                            {c.receipt_url && <a href={c.receipt_url} target="_blank" className="mt-2 block text-xs font-semibold text-brand-600 hover:underline">View receipt ↗</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {section === "support" && supabase && <TicketCenter mode="vendor" supabase={supabase} />}

          {section === "brand" && (
            <div className="pj-card max-w-md p-6">
              <h2 className="text-lg font-semibold">Your Brand 🏷️</h2>
              <p className="mt-1 text-sm text-slate-500">Your business name &amp; logo appear on every job — workers trust clear brands.</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  {logoFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(logoFile)} alt="Logo" className="h-full w-full object-cover" />
                  ) : logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                  Choose Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <label className="mt-5 block text-sm font-medium">Business name</label>
              <input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="e.g. Aqil Shoe Store" className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <button onClick={saveBrand} disabled={savingBrand} className="pj-btn-primary mt-4 w-full py-3">
                {savingBrand ? "Saving…" : "Save Brand"}
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">{toast}</div>}
    </div>
  );
}
