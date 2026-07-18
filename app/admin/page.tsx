"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/site";
import { TicketCenter } from "@/components/tickets";
import { createClient, hasSupabase } from "@/lib/supabase";

type Stats = { users: number; campaigns: number; open_tasks: number; pending_subs: number; pending_withdrawals: number; wallet_total: number };
type Plat = { total_fees: number; total_vendors: number; active_campaigns: number; escrow_held: number };
type UserRow = { id: string; full_name: string | null; whatsapp: string | null; wallet_balance: number; role: string; tasks_done: number; total_earned: number; created_at: string };
type Sub = { id: number; task_id: number; user_id: string; proof: string | null; proof_url: string | null; status: string; created_at: string };
type Row = Record<string, unknown>;

const GROUPS = [
  { label: null, items: [{ key: "ringkasan", icon: "📊", label: "Ringkasan" }] },
  { label: "Klien (Community)", items: [
    { key: "klien", icon: "👥", label: "Senarai Klien" },
    { key: "klien-tugasan", icon: "📋", label: "Laporan Tugasan" },
    { key: "klien-komisen", icon: "💰", label: "Laporan Komisyen" },
    { key: "klien-withdraw", icon: "🏦", label: "Laporan Pengeluaran" },
  ]},
  { label: "Vendor (Bisnes)", items: [
    { key: "vendor", icon: "📣", label: "Senarai Vendor" },
    { key: "vendor-tugasan", icon: "📋", label: "Laporan Tugasan" },
    { key: "vendor-komisen", icon: "💰", label: "Laporan Komisyen" },
    { key: "vendor-withdraw", icon: "🏦", label: "Laporan Pengeluaran" },
  ]},
  { label: "Kewangan", items: [
    { key: "payments", icon: "🧾", label: "Vendor Payments" },
  ]},
  { label: "Sistem", items: [
    { key: "support", icon: "🎫", label: "Support (Withdrawal)" },
    { key: "sms", icon: "📱", label: "SMS TAC" },
    { key: "settings", icon: "⚙️", label: "Fee Setting" },
  ]},
];

const PLATFORMS = ["Facebook", "Threads", "TikTok", "Instagram", "AI"];
function rm(n: unknown) { return "RM " + Number(n || 0).toFixed(2); }
function dt(v: unknown) { return v ? new Date(String(v)).toLocaleString("ms-MY") : "—"; }

export default function Admin() {
  const supabase = hasSupabase ? createClient() : null;
  const [ok, setOk] = useState<boolean | null>(null);
  const [section, setSection] = useState("ringkasan");
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [plat, setPlat] = useState<Plat | null>(null);
  const [clients, setClients] = useState<UserRow[]>([]);
  const [vendors, setVendors] = useState<UserRow[]>([]);
  const [report, setReport] = useState<Row[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // create task
  const [platform, setPlatform] = useState("Facebook");
  const [action, setAction] = useState("Follow akaun");
  const [reward, setReward] = useState(0.1);
  const [count, setCount] = useState(50);
  const [targetUrl, setTargetUrl] = useState("");
  const [proofTypes, setProofTypes] = useState<string[]>(["image"]);
  const [busy, setBusy] = useState(false);
  const toggleProof = (p: string) => setProofTypes((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]));

  const [dailyFees, setDailyFees] = useState<{ day: string; total: number }[]>([]);
  const [outstanding, setOutstanding] = useState(0);

  // vendor payments + fee
  const [payments, setPayments] = useState<Row[]>([]);
  const [feePct, setFeePct] = useState("20");
  const [savingFee, setSavingFee] = useState(false);

  async function verifyPayment(cid: number, approve: boolean) {
    if (!supabase) return;
    let reason = "";
    if (!approve) { reason = prompt("Reason for rejecting the receipt:") ?? ""; if (reason === "") return; }
    const { error } = await supabase.rpc("admin_verify_payment", { p_cid: cid, p_approve: approve, p_reason: reason });
    if (error) return flash("❌ " + error.message);
    flash(approve ? "✅ Payment verified" : "Receipt rejected");
    setPayments((p) => p.filter((x) => x.id !== cid));
  }
  async function saveFee() {
    if (!supabase) return;
    setSavingFee(true);
    const { error } = await supabase.rpc("admin_set_fee", { p_pct: Number(feePct) });
    setSavingFee(false);
    flash(error ? "❌ " + error.message : `✅ Platform fee set to ${feePct}%`);
  }

  // create user modal
  const [creatingUser, setCreatingUser] = useState<null | "user" | "vendor">(null);
  const [nuName, setNuName] = useState("");
  const [nuEmail, setNuEmail] = useState("");
  const [nuPhone, setNuPhone] = useState("");
  const [nuPass, setNuPass] = useState("");
  const [nuBusy, setNuBusy] = useState(false);

  async function createUser() {
    if (!supabase || !creatingUser) return;
    setNuBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      body: JSON.stringify({ name: nuName, email: nuEmail, phone: nuPhone, password: nuPass, role: creatingUser }),
    });
    const j = await res.json();
    setNuBusy(false);
    if (!j.ok) return flash("❌ " + (j.error || "Failed"));
    flash(`✅ ${creatingUser === "vendor" ? "Vendor" : "Client"} account created`);
    setCreatingUser(null); setNuName(""); setNuEmail(""); setNuPhone(""); setNuPass("");
    setSection((s) => s);
    if (creatingUser === "vendor") setVendors([]); else setClients([]);
    // trigger reload of the visible list
    const { data } = await supabase.rpc("admin_users_by_role", { p_role: creatingUser });
    if (creatingUser === "vendor") setVendors((data as UserRow[]) ?? []); else setClients((data as UserRow[]) ?? []);
  }

  // sms
  const [smsKey, setSmsKey] = useState("");
  const [smsSecret, setSmsSecret] = useState("");
  const [smsSender, setSmsSender] = useState("PeningJob");
  const [savingSms, setSavingSms] = useState(false);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const loadCore = useCallback(async () => {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/log-masuk"; return; }
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
    if (prof?.role !== "admin") { setOk(false); return; }
    setOk(true);
    const [st, pf, sms, df, os] = await Promise.all([
      supabase.rpc("admin_stats"),
      supabase.rpc("platform_stats"),
      supabase.rpc("admin_get_sms_config"),
      supabase.rpc("admin_daily_fees"),
      supabase.rpc("admin_outstanding"),
    ]);
    setStats((st.data as Stats) ?? null);
    setPlat((Array.isArray(pf.data) ? pf.data[0] : pf.data) as Plat);
    setDailyFees((df.data as { day: string; total: number }[]) ?? []);
    setOutstanding(typeof os.data === "number" ? os.data : 0);
    const s = Array.isArray(sms.data) ? sms.data[0] : sms.data;
    if (s) { setSmsKey(s.app_key ?? ""); setSmsSecret(s.app_secret ?? ""); setSmsSender(s.sender ?? "PeningJob"); }
  }, [supabase]);

  useEffect(() => { loadCore(); }, [loadCore]);

  // Lazy-load per section
  useEffect(() => {
    if (!supabase || ok !== true) return;
    (async () => {
      setLoadingReport(true);
      try {
        if (section === "klien") setClients(((await supabase.rpc("admin_users_by_role", { p_role: "user" })).data as UserRow[]) ?? []);
        else if (section === "vendor") setVendors(((await supabase.rpc("admin_users_by_role", { p_role: "vendor" })).data as UserRow[]) ?? []);
        else if (section === "klien-tugasan") setReport(((await supabase.rpc("admin_client_tasks")).data as Row[]) ?? []);
        else if (section === "vendor-tugasan") setReport(((await supabase.rpc("admin_vendor_tasks")).data as Row[]) ?? []);
        else if (section === "klien-komisen") setReport(((await supabase.rpc("admin_commission_report", { p_role: "user" })).data as Row[]) ?? []);
        else if (section === "vendor-komisen") setReport(((await supabase.rpc("admin_commission_report", { p_role: "vendor" })).data as Row[]) ?? []);
        else if (section === "klien-withdraw") setReport(((await supabase.rpc("admin_withdrawal_report", { p_role: "user" })).data as Row[]) ?? []);
        else if (section === "vendor-withdraw") setReport(((await supabase.rpc("admin_withdrawal_report", { p_role: "vendor" })).data as Row[]) ?? []);
        else if (section === "submissions") setSubs(((await supabase.from("submissions").select("*").eq("status", "pending").order("created_at", { ascending: false })).data as Sub[]) ?? []);
        else if (section === "payments") setPayments(((await supabase.rpc("admin_vendor_payments")).data as Row[]) ?? []);
        else if (section === "settings") { const fp = await supabase.rpc("get_fee_pct"); if (typeof fp.data === "number") setFeePct(String(fp.data)); }
      } finally { setLoadingReport(false); }
    })();
  }, [section, supabase, ok]);

  async function setRole(id: string, role: "user" | "vendor") {
    if (!supabase) return;
    const { error } = await supabase.rpc("admin_set_role", { p_user: id, p_role: role });
    if (error) return flash("❌ " + error.message);
    flash(role === "vendor" ? "✅ Dinaik taraf ke Vendor" : "✅ Ditukar ke Klien");
    setSection((s) => s); // trigger reload
    if (role === "vendor") setClients((c) => c.filter((u) => u.id !== id));
    else setVendors((v) => v.filter((u) => u.id !== id));
  }
  async function delUser(id: string, name: string | null) {
    if (!supabase) return;
    if (!window.confirm(`Padam akaun "${name || id}"? Tindakan ini kekal.`)) return;
    const { error } = await supabase.rpc("admin_delete_user", { p_id: id });
    if (error) return flash("❌ " + error.message);
    flash("🗑️ Akaun dipadam");
    setClients((c) => c.filter((u) => u.id !== id));
    setVendors((v) => v.filter((u) => u.id !== id));
  }
  async function decide(id: number, okk: boolean) {
    if (!supabase) return;
    let reason = "";
    if (!okk) {
      reason = prompt("Sebab tolak (cth: bukti palsu / akaun tidak sah / scam):") ?? "";
      if (reason === "") return;
    }
    const { error } = okk
      ? await supabase.rpc("approve_submission", { p_sub_id: id })
      : await supabase.rpc("reject_submission", { p_sub_id: id, p_reason: reason });
    if (error) return flash("❌ " + error.message);
    flash(okk ? "✅ Diluluskan" : "Ditolak");
    setSubs((s) => s.filter((x) => x.id !== id));
    loadCore();
  }
  async function processWd(id: number, approve: boolean) {
    if (!supabase) return;
    if (!approve && !confirm("Tolak permohonan pengeluaran ini?")) return;
    const { error } = await supabase.rpc("process_withdrawal", { p_id: id, p_approve: approve });
    if (error) return flash("❌ " + error.message);
    flash(approve ? "💸 Dibayar & baki client dipotong" : "Ditolak");
    setReport((r) => r.filter((x) => x.id !== id));
  }
  async function createTasks() {
    if (!supabase) return;
    if (proofTypes.length === 0) return flash("⚠️ Pilih jenis bukti");
    setBusy(true);
    const { error } = await supabase.rpc("admin_create_tasks", {
      p_platform: platform, p_service_type: platform === "AI" ? "AI Task" : "Engagement",
      p_action: action, p_reward: reward, p_count: count, p_proof_types: proofTypes, p_target_url: targetUrl || null,
    });
    setBusy(false);
    if (error) return flash("❌ " + error.message);
    flash(`✅ ${count} tugasan dicipta`); loadCore();
  }
  async function saveSms() {
    if (!supabase) return;
    setSavingSms(true);
    const { error } = await supabase.rpc("admin_set_sms_config", { p_key: smsKey, p_secret: smsSecret, p_sender: smsSender });
    setSavingSms(false);
    flash(error ? "❌ " + error.message : "✅ Konfigurasi SMS disimpan");
  }

  if (ok === false)
    return <div className="grid min-h-screen place-items-center px-4"><div className="pj-card p-8 text-center"><p className="text-3xl">🔒</p><p className="mt-2 font-bold">Akses admin sahaja</p><Link href="/dashboard" className="pj-btn-primary mt-4 inline-flex px-5 py-2.5">Dashboard</Link></div></div>;

  const activeLabel = GROUPS.flatMap((g) => g.items).find((i) => i.key === section)?.label ?? "Ringkasan";

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className={`${navOpen ? "block" : "hidden"} border-r border-slate-200/70 bg-white/70 backdrop-blur lg:block lg:w-64 lg:shrink-0 dark:border-white/10 dark:bg-slate-950/60`}>
        <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">ADMIN</span>
          </div>
          <nav className="mt-6 space-y-5">
            {GROUPS.map((g, gi) => (
              <div key={gi}>
                {g.label && <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</p>}
                <div className="mt-1.5 space-y-0.5">
                  {g.items.map((it) => (
                    <button
                      key={it.key}
                      onClick={() => { setSection(it.key); setNavOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        section === it.key ? "bg-brand-gradient text-white shadow-glow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="text-base">{it.icon}</span>
                      {it.label}
                      {it.key === "submissions" && (stats?.pending_subs ?? 0) > 0 && (
                        <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{stats?.pending_subs}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <Link href="/dashboard" className="mt-6 block rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">← Kembali ke Dashboard</Link>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <header className="pj-glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden dark:border-white/10">☰</button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">{activeLabel}</h1>
              <p className="text-xs text-slate-500">Panel Kawalan PeningJob</p>
            </div>
          </div>
          <button onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/log-masuk"; }} className="pj-btn-ghost px-3.5 py-2">Log Keluar</button>
        </header>

        <div className="p-4 lg:p-8">
          {/* RINGKASAN */}
          {section === "ringkasan" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold">Selamat kembali, Admin! 👋</h2>
                <p className="text-slate-500">Ringkasan sistem &amp; prestasi platform.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {[
                  { l: "Jumlah Pengguna", v: stats?.users ?? 0, icon: "👤" },
                  { l: "Klien Aktif Tugasan", v: stats?.open_tasks ?? 0, icon: "📋" },
                  { l: "Vendor", v: plat?.total_vendors ?? 0, icon: "📣" },
                  { l: "Submission Menunggu", v: stats?.pending_subs ?? 0, icon: "✅", hot: true },
                  { l: "Withdraw Menunggu", v: stats?.pending_withdrawals ?? 0, icon: "🏦", hot: true },
                  { l: "Jumlah Wallet", v: rm(stats?.wallet_total), icon: "👛" },
                ].map((s) => (
                  <div key={s.l} className={`pj-card p-5 ${s.hot && Number(s.v) > 0 ? "ring-1 ring-rose-300" : ""}`}>
                    <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{s.l}</p><span className="text-xl">{s.icon}</span></div>
                    <p className="mt-2 text-2xl font-extrabold">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-glow">
                  <p className="text-sm text-white/80">💰 Pendapatan Platform (fee dibayar)</p>
                  <p className="mt-1 text-4xl font-extrabold">{rm(plat?.total_fees)}</p>
                  <p className="mt-1 text-sm text-white/80">Escrow dipegang: {rm(plat?.escrow_held)}</p>
                </div>
                <div className="pj-card p-5">
                  <p className="text-xs font-semibold text-slate-500">🧾 Invois Vendor Belum Bayar</p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-600">{rm(outstanding)}</p>
                  <p className="mt-1 text-xs text-slate-400">Tunggak dari job luput</p>
                </div>
                <div className="pj-card p-5 lg:col-span-1">
                  <p className="text-xs font-semibold text-slate-500">Fee Harian · 14 hari</p>
                  <p className="mt-1 text-lg font-extrabold text-gradient">{rm(dailyFees.reduce((a, d) => a + Number(d.total), 0))}</p>
                  {(() => { const mx = Math.max(0.01, ...dailyFees.map((d) => Number(d.total))); return (
                    <div className="mt-3 flex h-16 items-end gap-[3px]">
                      {dailyFees.map((d) => (
                        <div key={d.day} className="group relative flex-1">
                          <div className="w-full rounded-t bg-brand-500/90 transition group-hover:bg-brand-600" style={{ height: `${Math.max(2, (Number(d.total) / mx) * 58)}px` }} />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block dark:bg-white dark:text-slate-900">{d.day} · {rm(d.total)}</div>
                        </div>
                      ))}
                    </div>
                  ); })()}
                </div>
              </div>
            </div>
          )}

          {/* CRUD KLIEN / VENDOR */}
          {(section === "klien" || section === "vendor") && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setCreatingUser(section === "vendor" ? "vendor" : "user")} className="pj-btn-primary px-4 py-2">
                  + Add {section === "vendor" ? "Vendor" : "Client"}
                </button>
              </div>
              <UserTable
                rows={section === "klien" ? clients : vendors}
                isVendor={section === "vendor"}
                loading={loadingReport}
                onRole={setRole}
                onDelete={delUser}
              />
            </div>
          )}

          {/* REPORTS */}
          {section === "klien-tugasan" && <ReportTable loading={loadingReport} rows={report} cols={[["user_name", "Klien"], ["whatsapp", "Telefon"], ["platform", "Platform"], ["action", "Tugasan"], ["reward", "Ganjaran", "rm"], ["status", "Status"], ["created_at", "Tarikh", "dt"]]} empty="Tiada tugasan klien lagi." />}
          {section === "vendor-tugasan" && <ReportTable loading={loadingReport} rows={report} cols={[["vendor_name", "Vendor"], ["platform", "Platform"], ["service_type", "Servis"], ["quantity", "Kuantiti"], ["delivered", "Siap"], ["cost", "Kos", "rm"], ["fee", "Fee", "rm"], ["status", "Status"], ["created_at", "Tarikh", "dt"]]} empty="Tiada kempen vendor lagi." />}
          {section === "klien-komisen" && <ReportTable loading={loadingReport} rows={report} cols={[["user_name", "Klien"], ["whatsapp", "Telefon"], ["amount", "Komisyen", "rm"], ["note", "Nota"], ["created_at", "Tarikh", "dt"]]} empty="Tiada komisyen klien lagi." />}
          {section === "vendor-komisen" && <ReportTable loading={loadingReport} rows={report} cols={[["user_name", "Vendor"], ["whatsapp", "Telefon"], ["amount", "Komisyen", "rm"], ["note", "Nota"], ["created_at", "Tarikh", "dt"]]} empty="Tiada komisyen vendor lagi." />}
          {section === "klien-withdraw" && <WithdrawTable loading={loadingReport} rows={report} onProcess={processWd} />}
          {section === "vendor-withdraw" && <WithdrawTable loading={loadingReport} rows={report} onProcess={processWd} />}

          {/* SUBMISSIONS */}
          {section === "submissions" && (
            <div className="space-y-3">
              {subs.length === 0 && <p className="pj-card p-10 text-center text-slate-400">Tiada submission menunggu ✅</p>}
              {subs.map((s) => {
                const isVideo = s.proof_url ? /\.(mp4|webm|mov|m4v)($|\?)/i.test(s.proof_url) : false;
                return (
                  <div key={s.id} className="pj-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Tugasan #{s.task_id}</p>
                        {s.proof && <p className="text-sm text-slate-500">🔗 {s.proof}</p>}
                        <p className="text-xs text-slate-400">User {s.user_id.slice(0, 8)}… · {dt(s.created_at)}</p>
                        {s.proof_url && (isVideo
                          ? <video src={s.proof_url} controls className="mt-3 max-h-56 rounded-xl border border-slate-200 dark:border-white/10" />
                          // eslint-disable-next-line @next/next/no-img-element
                          : <a href={s.proof_url} target="_blank"><img src={s.proof_url} alt="Bukti" className="mt-3 max-h-56 rounded-xl border border-slate-200 object-contain dark:border-white/10" /></a>)}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => decide(s.id, true)} className="pj-btn-primary px-4 py-2">Lulus</button>
                        <button onClick={() => decide(s.id, false)} className="pj-btn-ghost px-4 py-2">Tolak</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CIPTA TUGASAN */}
          {section === "cipta" && (
            <div className="max-w-xl pj-card p-6">
              <h2 className="text-lg font-semibold">Cipta Tugasan Baru</h2>
              <label className="mt-4 block text-sm font-medium">Kategori</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
              <label className="mt-4 block text-sm font-medium">Arahan tugasan</label>
              <input value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <label className="mt-4 block text-sm font-medium">Link sasaran</label>
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <label className="mt-4 block text-sm font-medium">Jenis bukti</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[["image", "📷 Gambar"], ["video", "🎬 Video"], ["link", "🔗 Link"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => toggleProof(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${proofTypes.includes(k) ? "bg-brand-gradient text-white" : "border border-slate-300 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}>{l}</button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium">Ganjaran (RM)</label><input type="number" step="0.01" min="0.01" value={reward} onChange={(e) => setReward(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" /></div>
                <div><label className="block text-sm font-medium">Bilangan</label><input type="number" min="1" max="1000" value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-xl px-4 py-2.5" /></div>
              </div>
              <button onClick={createTasks} disabled={busy} className="pj-btn-primary mt-5 w-full py-3">{busy ? "Mencipta…" : `Cipta ${count} Tugasan`}</button>
            </div>
          )}

          {/* SMS */}
          {section === "payments" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Expired jobs with an invoice. Verify the vendor&apos;s payment receipt to confirm.</p>
              {loadingReport ? <p className="pj-card p-10 text-center text-slate-400">Memuatkan…</p> : payments.length === 0 ? (
                <p className="pj-card p-12 text-center text-slate-400">Tiada bayaran menunggu ✅</p>
              ) : payments.map((r) => (
                <div key={String(r.id)} className="pj-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{fmt(r.title)} <span className="text-xs font-normal text-slate-400">· {fmt(r.platform)} · {fmt(r.delivered)}/{fmt(r.quantity)} done</span></p>
                      <p className="text-sm text-slate-500">🏢 {fmt(r.company ?? r.vendor_name)} · {fmt(r.whatsapp)}</p>
                      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                        <div className="flex justify-between gap-8"><span className="text-slate-500">Invoice</span><span>{rm(r.invoice)}</span></div>
                        <div className="flex justify-between gap-8"><span className="text-slate-500">Platform fee</span><span className="text-brand-600">{rm(r.invoice_fee)}</span></div>
                        <div className="mt-1 flex justify-between gap-8 border-t border-slate-200 pt-1 font-bold dark:border-white/10"><span>Total</span><span>{rm(r.invoice_total)}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${r.payment_status === "submitted" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"}`}>{r.payment_status === "submitted" ? "Receipt submitted" : "Awaiting receipt"}</span>
                      {typeof r.receipt_url === "string" && r.receipt_url && <a href={r.receipt_url} target="_blank" className="mt-2 block text-sm font-semibold text-brand-600 hover:underline">View receipt ↗</a>}
                      {r.payment_status === "submitted" && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => verifyPayment(Number(r.id), true)} className="pj-btn-primary px-3.5 py-1.5">Verify Paid</button>
                          <button onClick={() => verifyPayment(Number(r.id), false)} className="pj-btn-ghost px-3.5 py-1.5">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "settings" && (
            <div className="max-w-md pj-card p-6">
              <h2 className="text-lg font-semibold">Platform Fee Setting</h2>
              <p className="mt-1 text-sm text-slate-500">The % charged on top of every vendor job invoice. Applies to new jobs.</p>
              <label className="mt-4 block text-sm font-medium">Fee (%)</label>
              <input type="number" min="0" max="90" step="0.5" value={feePct} onChange={(e) => setFeePct(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <button onClick={saveFee} disabled={savingFee} className="pj-btn-primary mt-5 w-full py-3">{savingFee ? "Saving…" : "Save Fee"}</button>
            </div>
          )}

          {section === "support" && supabase && <TicketCenter mode="admin" supabase={supabase} />}

          {section === "sms" && (
            <div className="max-w-lg pj-card p-6">
              <h2 className="text-lg font-semibold">Konfigurasi SMS TAC (360)</h2>
              <p className="mt-1 text-sm text-slate-500">Kod TAC pendaftaran dihantar melalui gerbang 360.</p>
              <label className="mt-5 block text-sm font-medium">API Key (APP_KEY)</label>
              <input value={smsKey} onChange={(e) => setSmsKey(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5 font-mono text-sm" />
              <label className="mt-4 block text-sm font-medium">API Secret (APP_SECRET)</label>
              <input value={smsSecret} onChange={(e) => setSmsSecret(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5 font-mono text-sm" />
              <label className="mt-4 block text-sm font-medium">Sender ID</label>
              <input value={smsSender} onChange={(e) => setSmsSender(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
              <button onClick={saveSms} disabled={savingSms} className="pj-btn-primary mt-5 w-full py-3">{savingSms ? "Menyimpan…" : "Simpan Konfigurasi SMS"}</button>
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">💡 Di 360 → Whitelist IPs, masukkan <b>0.0.0.0</b> (semua IP) supaya SMS jalan dari Vercel tanpa proksi.</div>
            </div>
          )}
        </div>
      </main>

      {/* create user modal */}
      {creatingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setCreatingUser(null)}>
          <div className="pj-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add {creatingUser === "vendor" ? "Vendor" : "Client"}</h3>
              <button onClick={() => setCreatingUser(null)} className="text-slate-400">✕</button>
            </div>
            <label className="mt-4 block text-sm font-medium">Full Name *</label>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
            <label className="mt-3 block text-sm font-medium">Email *</label>
            <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5" />
            <label className="mt-3 block text-sm font-medium">Phone (optional)</label>
            <input value={nuPhone} onChange={(e) => setNuPhone(e.target.value)} placeholder="e.g. 0123456789" className="mt-1 w-full rounded-xl px-4 py-2.5" />
            <label className="mt-3 block text-sm font-medium">Password *</label>
            <input value={nuPass} onChange={(e) => setNuPass(e.target.value)} placeholder="min. 6 characters" className="mt-1 w-full rounded-xl px-4 py-2.5" />
            <button onClick={createUser} disabled={nuBusy} className="pj-btn-primary mt-5 w-full py-3">
              {nuBusy ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">{toast}</div>}
    </div>
  );
}

function UserTable({ rows, isVendor, loading, onRole, onDelete }: { rows: UserRow[]; isVendor: boolean; loading: boolean; onRole: (id: string, r: "user" | "vendor") => void; onDelete: (id: string, n: string | null) => void }) {
  if (loading) return <p className="pj-card p-10 text-center text-slate-400">Memuatkan…</p>;
  if (rows.length === 0) return <p className="pj-card p-10 text-center text-slate-400">Tiada {isVendor ? "vendor" : "klien"} lagi.</p>;
  return (
    <div className="pj-card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-white/5"><tr>
          <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Telefon</th><th className="px-4 py-3">Wallet</th>
          <th className="px-4 py-3">Tugasan</th><th className="px-4 py-3">Diperoleh</th><th className="px-4 py-3">Sertai</th><th className="px-4 py-3">Tindakan</th>
        </tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-t border-slate-100 dark:border-white/5">
              <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
              <td className="px-4 py-3">{u.whatsapp || "—"}</td>
              <td className="px-4 py-3">{rm(u.wallet_balance)}</td>
              <td className="px-4 py-3">{u.tasks_done}</td>
              <td className="px-4 py-3">{rm(u.total_earned)}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{dt(u.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {isVendor
                    ? <button onClick={() => onRole(u.id, "user")} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold dark:border-white/10">↓ Klien</button>
                    : <button onClick={() => onRole(u.id, "vendor")} className="rounded-lg bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">↑ Vendor</button>}
                  <button onClick={() => onDelete(u.id, u.full_name)} className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30">Padam</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(v: unknown, kind?: string) { return kind === "rm" ? rm(v) : kind === "dt" ? dt(v) : (v == null || v === "" ? "—" : String(v)); }

function ReportTable({ rows, cols, empty, loading }: { rows: Row[]; cols: (string[])[]; empty: string; loading: boolean }) {
  if (loading) return <p className="pj-card p-10 text-center text-slate-400">Memuatkan…</p>;
  if (rows.length === 0) return <p className="pj-card p-10 text-center text-slate-400">{empty}</p>;
  return (
    <div className="pj-card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-white/5"><tr>{cols.map((c) => <th key={c[0]} className="px-4 py-3">{c[1]}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-white/5">
              {cols.map((c) => <td key={c[0]} className="px-4 py-3">{fmt(r[c[0]], c[2])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawTable({ rows, onProcess, loading }: { rows: Row[]; onProcess: (id: number, ap: boolean) => void; loading: boolean }) {
  if (loading) return <p className="pj-card p-10 text-center text-slate-400">Memuatkan…</p>;
  if (rows.length === 0) return <p className="pj-card p-10 text-center text-slate-400">Tiada pengeluaran lagi.</p>;
  return (
    <div className="pj-card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-white/5"><tr>
          <th className="px-4 py-3">Nama</th><th className="px-4 py-3">IC</th><th className="px-4 py-3">Jumlah</th>
          <th className="px-4 py-3">TNG</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tindakan</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t border-slate-100 dark:border-white/5">
              <td className="px-4 py-3 font-medium">{fmt(r.user_name)}<p className="text-xs font-normal text-slate-400">{fmt(r.whatsapp)}</p></td>
              <td className="px-4 py-3">{fmt(r.ic_number)}</td>
              <td className="px-4 py-3 font-bold">{rm(r.amount)}</td>
              <td className="px-4 py-3">
                {fmt(r.tng_phone ?? r.method)}
                {typeof r.tng_qr_url === "string" && r.tng_qr_url && (
                  <a href={r.tng_qr_url} target="_blank" className="block text-xs font-semibold text-brand-600 hover:underline">View QR ↗</a>
                )}
              </td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.status === "paid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : r.status === "rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{String(r.status)}</span></td>
              <td className="px-4 py-3">
                {r.status === "requested" ? (
                  <div className="flex gap-2">
                    <button onClick={() => onProcess(Number(r.id), true)} className="pj-btn-primary px-3 py-1.5">Bayar</button>
                    <button onClick={() => onProcess(Number(r.id), false)} className="pj-btn-ghost px-3 py-1.5">Tolak</button>
                  </div>
                ) : <span className="text-xs text-slate-400">Selesai</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
