"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/site";
import { PlatformIcon } from "@/components/icons";
import { TicketCenter } from "@/components/tickets";
import { compressImage } from "@/lib/compress";
import { createClient, hasSupabase } from "@/lib/supabase";

type Campaign = { id: number; platform: string; title: string | null; quantity: number; delivered: number; escrow: number; fee: number; status: string; created_at: string };
type Sub = {
  id: number; task_id: number; job_title: string; platform: string; reward: number;
  client_name: string | null; client_profile_url: string | null; description: string | null;
  proof_urls: string[] | null; evidence_type: string; created_at: string;
};
type Txn = { id: number; amount: number; kind: string; note: string | null; created_at: string };

const NAV = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "create", icon: "➕", label: "Create Job" },
  { key: "review", icon: "🔍", label: "Review Submissions" },
  { key: "jobs", icon: "📋", label: "My Jobs" },
  { key: "wallet", icon: "👛", label: "Wallet" },
  { key: "support", icon: "🎫", label: "Support" },
  { key: "brand", icon: "🏷️", label: "Brand" },
];
const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "Threads", "Shopee"];
const ICON_KEY: Record<string, string> = { Facebook: "facebook", Threads: "threads", Instagram: "instagram", YouTube: "youtube", TikTok: "tiktok", Shopee: "shopee" };
const FEE_PCT = 20;

function rm(n: unknown) { return "RM " + Number(n || 0).toFixed(2); }

export default function VendorPanel() {
  const supabase = useMemo(() => (hasSupabase ? createClient() : null), []);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [section, setSection] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [wallet, setWallet] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

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
  const [deadline, setDeadline] = useState("");
  const [durationMin, setDurationMin] = useState(5);
  const [evidenceType, setEvidenceType] = useState<"image" | "video">("image");
  const [claimMode, setClaimMode] = useState<"once" | "multi">("once");
  const [perUserQuota, setPerUserQuota] = useState(2);
  const [instructions, setInstructions] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [exampleFiles, setExampleFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const total = Math.round(reward * count * 100) / 100;
  const fee = Math.round(total * FEE_PCT) / 100;
  const charge = Math.round((total + fee) * 100) / 100;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/log-masuk"; return; }
    const { data: prof } = await supabase.from("profiles").select("role,wallet_balance,business_name,avatar_url").eq("id", auth.user.id).single();
    if (!prof || !["vendor", "admin"].includes(prof.role)) { setAllowed(false); return; }
    setAllowed(true);
    setWallet(Number(prof.wallet_balance));
    setBizName(prof.business_name ?? "");
    setLogoUrl(prof.avatar_url ?? null);
    const [c, s, w] = await Promise.all([
      supabase.from("campaigns").select("id,platform,title,quantity,delivered,escrow,fee,status,created_at").eq("owner", auth.user.id).order("created_at", { ascending: false }),
      supabase.rpc("vendor_pending_submissions"),
      supabase.from("wallet_transactions").select("id,amount,kind,note,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setCampaigns((c.data as Campaign[]) ?? []);
    setSubs((s.data as Sub[]) ?? []);
    setTxns((w.data as Txn[]) ?? []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function createJob() {
    if (!supabase) return;
    if (!jobName.trim()) return flash("⚠️ Enter the job name");
    if (!instructions.trim()) return flash("⚠️ Write the job instructions");
    setBusy(true);
    const exampleUrls: string[] = [];
    const { data: auth } = await supabase.auth.getUser();
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
      p_deadline: deadline ? new Date(deadline).toISOString() : null,
      p_instructions: instructions, p_target_url: targetUrl || null, p_example_urls: exampleUrls,
    });
    setBusy(false);
    if (error) return flash("❌ " + error.message);
    flash(`✅ Job published! ${count} slots are now open.`);
    setJobName(""); setInstructions(""); setTargetUrl(""); setExampleFiles([]); setDeadline("");
    load(); setSection("jobs");
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

  async function topup() {
    if (!supabase) return;
    const v = prompt("Topup amount (RM):", "50");
    if (!v) return;
    const { error } = await supabase.rpc("topup_wallet", { p_amount: Number(v) });
    flash(error ? "❌ " + error.message : "✅ Wallet topped up " + rm(Number(v)));
    if (!error) load();
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

  const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
  const escrowHeld = campaigns.reduce((a, c) => a + (c.status === "running" ? Number(c.escrow) : 0), 0);
  const activeLabel = NAV.find((n) => n.key === section)?.label ?? "";

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
            <p className="text-xs text-slate-400">{rm(wallet)} balance</p>
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
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-glow">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Wallet Balance</p>
                  <p className="mt-2 text-3xl font-extrabold">{rm(wallet)}</p>
                  <button onClick={topup} className="mt-3 rounded-xl bg-white px-4 py-1.5 text-sm font-bold text-brand-600">+ Topup</button>
                </div>
                {[
                  { l: "Active Jobs", v: activeCampaigns, icon: "📋" },
                  { l: "Pending Review", v: subs.length, icon: "🔍", hot: subs.length > 0 },
                  { l: "Escrow Held", v: rm(escrowHeld), icon: "🔒" },
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
                  <li>1️⃣ <b>Topup</b> your wallet</li>
                  <li>2️⃣ <b>Create a job</b> — cost = reward × quota + {FEE_PCT}% platform fee (held in escrow)</li>
                  <li>3️⃣ Community members take your job &amp; submit proof</li>
                  <li>4️⃣ <b>Review proofs</b> — approve to pay from escrow, or reject with a reason</li>
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
              <label className="mt-4 block text-sm font-medium">Job Deadline (optional)</label>
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
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
              <label className="mt-4 block text-sm font-medium">Job Link (target URL)</label>
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://www.tiktok.com/@your_account" className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <label className="mt-4 block text-sm font-medium">Instructions *</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} placeholder={"1. Open the job link\n2. Follow the account\n3. Screenshot as proof"} className="mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
              <label className="mt-4 block text-sm font-medium">Evidence Examples (images, optional)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setExampleFiles(Array.from(e.target.files ?? []))} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />
              {exampleFiles.length > 0 && <p className="mt-1 text-xs text-brand-500">✓ {exampleFiles.length} image(s) selected (auto-compressed)</p>}
              <div className="mt-5 space-y-1 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
                <div className="flex justify-between"><span className="text-slate-500">Rewards ({count} × {rm(reward)})</span><span>{rm(total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Platform fee ({FEE_PCT}%)</span><span>{rm(fee)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold dark:border-white/10"><span>Total charge</span><span className="text-brand-600">{rm(charge)}</span></div>
              </div>
              <button onClick={createJob} disabled={busy} className="pj-btn-primary mt-4 w-full py-3">
                {busy ? "Publishing…" : `Publish Job (${rm(charge)} from wallet)`}
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
                      <th className="px-5 py-3.5">Escrow Left</th><th className="px-5 py-3.5">Fee Paid</th><th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                        <td className="max-w-[220px] truncate px-5 py-3.5 font-semibold">{c.title || `Job #${c.id}`}</td>
                        <td className="px-5 py-3.5">
                          <span className="flex w-fit items-center gap-1.5">{ICON_KEY[c.platform] && <PlatformIcon name={ICON_KEY[c.platform]} size={22} />}{c.platform}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-brand-gradient" style={{ width: `${Math.min(100, (c.delivered / c.quantity) * 100)}%` }} /></div>
                            <span className="text-xs text-slate-500">{c.delivered}/{c.quantity}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">{rm(c.escrow)}</td>
                        <td className="px-5 py-3.5">{rm(c.fee)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "completed" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"}`}>{c.status === "completed" ? "Completed" : "Running"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === "wallet" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-glow">
                  <p className="text-sm text-white/80">Wallet Balance</p>
                  <p className="mt-1 text-3xl font-extrabold">{rm(wallet)}</p>
                  <button onClick={topup} className="mt-4 rounded-xl bg-white px-5 py-2.5 font-semibold text-brand-600 hover:scale-[1.02]">+ Topup Wallet</button>
                  <p className="mt-2 text-xs text-white/80">Job cost (rewards + {FEE_PCT}% fee) is deducted from this balance.</p>
                </div>
                <div className="pj-card p-5 text-sm text-slate-500">
                  <p className="font-bold text-slate-700 dark:text-slate-200">💡 Escrow protection</p>
                  <p className="mt-1">When you publish a job, the reward pool is held in escrow. Workers are paid only when you approve their proof.</p>
                </div>
              </div>
              <div className="pj-card overflow-hidden p-0">
                <p className="border-b border-slate-100 px-5 py-3.5 font-bold dark:border-white/10">Recent Transactions</p>
                {txns.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No transactions.</p> : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {txns.map((x) => (
                      <li key={x.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                        <div><p className="font-medium text-slate-700 dark:text-slate-200">{x.note ?? x.kind}</p><p className="text-xs text-slate-400">{new Date(x.created_at).toLocaleString("en-MY")}</p></div>
                        <span className={`font-bold ${x.amount >= 0 ? "text-brand-600" : "text-rose-500"}`}>{x.amount >= 0 ? "+" : ""}{rm(x.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
