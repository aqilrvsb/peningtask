"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Campaign = { id: number; platform: string; quantity: number; delivered: number; escrow: number; fee: number; status: string; created_at: string };
type Sub = { id: number; task_id: number; proof: string | null; proof_url: string | null; status: string; created_at: string; tasks: { action: string; reward: number; campaign_id: number } | null };

const TABS = ["Ringkasan", "Cipta Kempen", "Semakan Bukti", "Kempen Saya", "Wallet", "Brand"] as const;
type Tab = (typeof TABS)[number];
const PLATFORMS = ["Facebook", "Threads", "TikTok", "Instagram", "AI"];
const FEE_PCT = 20;

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

export default function VendorPanel() {
  const supabase = hasSupabase ? createClient() : null;
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // brand settings
  const [bizName, setBizName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);

  // create form
  const [platform, setPlatform] = useState("Facebook");
  const [action, setAction] = useState("");
  const [reward, setReward] = useState(0.1);
  const [count, setCount] = useState(20);
  const [targetUrl, setTargetUrl] = useState("");
  const [proofTypes, setProofTypes] = useState<string[]>(["image"]);
  const [busy, setBusy] = useState(false);

  const total = Math.round(reward * count * 100) / 100;
  const fee = Math.round(total * FEE_PCT) / 100;
  const charge = Math.round((total + fee) * 100) / 100;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };
  const toggleProof = (p: string) =>
    setProofTypes((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/log-masuk";
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role,wallet_balance,business_name,avatar_url").eq("id", auth.user.id).single();
    if (!prof || !["vendor", "admin"].includes(prof.role)) {
      setAllowed(false);
      return;
    }
    setAllowed(true);
    setWallet(Number(prof.wallet_balance));
    setBizName(prof.business_name ?? "");
    setLogoUrl(prof.avatar_url ?? null);
    const [c, s] = await Promise.all([
      supabase.from("campaigns").select("id,platform,quantity,delivered,escrow,fee,status,created_at").eq("owner", auth.user.id).order("created_at", { ascending: false }),
      supabase
        .from("submissions")
        .select("id,task_id,proof,proof_url,status,created_at,tasks!inner(action,reward,campaign_id,campaign:campaigns!inner(owner))")
        .eq("status", "pending")
        .eq("tasks.campaign.owner", auth.user.id)
        .order("created_at", { ascending: true }),
    ]);
    setCampaigns((c.data as Campaign[]) ?? []);
    setSubs((s.data as unknown as Sub[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function createCampaign() {
    if (!supabase) return;
    if (!action.trim()) {
      flash("⚠️ Tulis arahan tugasan");
      return;
    }
    if (proofTypes.length === 0) {
      flash("⚠️ Pilih jenis bukti");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("vendor_create_campaign", {
      p_platform: platform,
      p_action: action,
      p_reward: reward,
      p_count: count,
      p_proof_types: proofTypes,
      p_target_url: targetUrl || null,
    });
    setBusy(false);
    if (error) flash("❌ " + error.message);
    else {
      flash(`✅ Kempen dilancarkan! ${count} tugasan kini terbuka.`);
      setAction("");
      setTargetUrl("");
      load();
    }
  }

  async function decide(id: number, ok: boolean) {
    if (!supabase) return;
    let reason = "";
    if (!ok) {
      reason = prompt("Sebab tolak (cth: bukti palsu / akaun tidak sah / scam):") ?? "";
      if (reason === "") return; // cancelled
    }
    const { error } = ok
      ? await supabase.rpc("approve_submission", { p_sub_id: id })
      : await supabase.rpc("reject_submission", { p_sub_id: id, p_reason: reason });
    if (error) flash("❌ " + error.message);
    else {
      flash(ok ? "✅ Diluluskan — pekerja dibayar dari escrow" : "Submission ditolak");
      load();
    }
  }

  async function saveBrand() {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setSavingBrand(true);
    let url = logoUrl;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `${auth.user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("logos").upload(path, logoFile, { upsert: true });
      if (upErr) {
        setSavingBrand(false);
        flash("❌ Muat naik logo gagal: " + upErr.message);
        return;
      }
      url = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
    }
    const { error } = await supabase
      .from("profiles")
      .update({ business_name: bizName || null, avatar_url: url })
      .eq("id", auth.user.id);
    setSavingBrand(false);
    if (error) flash("❌ " + error.message);
    else {
      setLogoUrl(url);
      setLogoFile(null);
      flash("✅ Brand disimpan — logo anda kini dipaparkan pada setiap tugasan");
    }
  }

  async function topup() {
    if (!supabase) return;
    const v = prompt("Jumlah topup (RM):", "50");
    if (!v) return;
    const { error } = await supabase.rpc("topup_wallet", { p_amount: Number(v) });
    if (error) flash("❌ " + error.message);
    else {
      flash("✅ Wallet ditambah " + rm(Number(v)));
      load();
    }
  }

  if (allowed === false)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl">📣</p>
          <h1 className="mt-3 text-xl font-bold">Panel Vendor</h1>
          <p className="mt-2 text-sm text-slate-500">
            Akaun anda belum berstatus vendor. Daftar akaun vendor baharu atau hubungi admin untuk naik taraf.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded-md bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">VENDOR</span>
          </div>
          <Link href="/dashboard" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
            <p className="text-sm text-brand-100">Baki Wallet</p>
            <p className="mt-1 text-2xl font-bold">{rm(wallet)}</p>
          </div>
          {[
            { l: "Kempen Aktif", v: campaigns.filter((c) => c.status === "running").length },
            { l: "Menunggu Semakan", v: subs.length },
            { l: "Escrow Dipegang", v: rm(campaigns.reduce((a, c) => a + (c.status === "running" ? Number(c.escrow) : 0), 0)) },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">{s.l}</p>
              <p className="mt-1 text-2xl font-bold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="mt-8 flex flex-wrap gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${
                tab === t ? "border-brand-500 text-brand-500" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t}
              {t === "Semakan Bukti" && subs.length > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 text-xs text-white">{subs.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Ringkasan" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Selamat datang ke Panel Vendor 📣</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>1️⃣ <b>Topup wallet</b> anda</li>
                <li>2️⃣ <b>Cipta kempen</b> — tetapkan arahan, ganjaran & jenis bukti (kos = ganjaran × bilangan + fee platform {FEE_PCT}%)</li>
                <li>3️⃣ Komuniti buat tugasan & hantar bukti</li>
                <li>4️⃣ <b>Semak bukti</b> — lulus, dan pekerja dibayar automatik dari escrow</li>
              </ol>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setTab("Cipta Kempen")} className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
                  Cipta Kempen
                </button>
                <button onClick={topup} className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Topup Wallet
                </button>
              </div>
            </div>
          )}

          {tab === "Cipta Kempen" && (
            <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Cipta Kempen Baru</h2>
              <label className="mt-4 block text-sm font-medium">Kategori</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <label className="mt-4 block text-sm font-medium">Arahan tugasan</label>
              <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="cth: Follow akaun & like 3 post terbaru" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
              <label className="mt-4 block text-sm font-medium">Link sasaran</label>
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://www.tiktok.com/@akaun_anda" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
              <label className="mt-4 block text-sm font-medium">Jenis bukti diperlukan</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { k: "image", l: "📷 Gambar" },
                  { k: "video", l: "🎬 Video" },
                  { k: "link", l: "🔗 Link/Username" },
                ].map((p) => (
                  <button key={p.k} type="button" onClick={() => toggleProof(p.k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${proofTypes.includes(p.k) ? "bg-brand-500 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>
                    {p.l}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Ganjaran / tugasan (RM)</label>
                  <input type="number" step="0.01" min="0.01" value={reward} onChange={(e) => setReward(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Bilangan tugasan</label>
                  <input type="number" min="1" max="1000" value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                </div>
              </div>
              <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                <div className="flex justify-between"><span className="text-slate-500">Ganjaran ({count} × {rm(reward)})</span><span>{rm(total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fee platform ({FEE_PCT}%)</span><span>{rm(fee)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold dark:border-slate-700"><span>Jumlah caj</span><span className="text-brand-500">{rm(charge)}</span></div>
              </div>
              <button onClick={createCampaign} disabled={busy} className="mt-4 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {busy ? "Melancarkan…" : `Lancar Kempen (${rm(charge)} dari wallet)`}
              </button>
            </div>
          )}

          {tab === "Semakan Bukti" && (
            <div className="space-y-3">
              {subs.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">Tiada bukti menunggu semakan ✅</p>}
              {subs.map((s) => {
                const isVideo = s.proof_url ? /\.(mp4|webm|mov|m4v)($|\?)/i.test(s.proof_url) : false;
                return (
                  <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{s.tasks?.action ?? `Tugasan #${s.task_id}`}</p>
                        <p className="text-sm text-slate-500">Ganjaran {rm(s.tasks?.reward ?? 0)} {s.proof ? `· 🔗 ${s.proof}` : ""}</p>
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
                        <button onClick={() => decide(s.id, true)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Lulus & Bayar</button>
                        <button onClick={() => decide(s.id, false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Tolak</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Kempen Saya" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {campaigns.length === 0 ? (
                <p className="p-8 text-center text-slate-400">Belum ada kempen.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Progres</th>
                      <th className="px-4 py-3">Escrow Baki</th>
                      <th className="px-4 py-3">Fee Dibayar</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 font-medium">{c.platform}</td>
                        <td className="px-4 py-3">{c.delivered}/{c.quantity}</td>
                        <td className="px-4 py-3">{rm(c.escrow)}</td>
                        <td className="px-4 py-3">{rm(c.fee)}</td>
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
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Baki tersedia</p>
              <p className="mt-1 text-3xl font-bold text-brand-500">{rm(wallet)}</p>
              <button onClick={topup} className="mt-4 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600">
                Topup Wallet
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">Kos kempen (ganjaran + fee {FEE_PCT}%) ditolak dari baki ini.</p>
            </div>
          )}

          {tab === "Brand" && (
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Brand Anda 🏷️</h2>
              <p className="mt-1 text-sm text-slate-500">
                Nama & logo bisnes dipaparkan pada setiap tugasan anda — pengguna lebih yakin dengan brand yang jelas.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
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
                <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Pilih Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <label className="mt-5 block text-sm font-medium">Nama bisnes</label>
              <input
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="cth: Kedai Kasut Aqil"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
              <button onClick={saveBrand} disabled={savingBrand} className="mt-4 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {savingBrand ? "Menyimpan…" : "Simpan Brand"}
              </button>
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
