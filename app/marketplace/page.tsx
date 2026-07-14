"use client";

import { useEffect, useState } from "react";
import { Nav, Footer } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Service = {
  id: number;
  platform: string;
  service_type: string;
  price_per_unit: number;
  unit: number;
};

const EMOJI: Record<string, string> = {
  TikTok: "🎵",
  Instagram: "📸",
  Facebook: "👍",
  YouTube: "▶️",
  Threads: "🧵",
  "Twitter / X": "𝕏",
};
const CATS = ["Semua", "TikTok", "Instagram", "Facebook", "YouTube", "Threads", "Twitter / X"];

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

export default function Marketplace() {
  const supabase = hasSupabase ? createClient() : null;
  const [services, setServices] = useState<Service[]>([]);
  const [cat, setCat] = useState("Semua");
  const [active, setActive] = useState<Service | null>(null);
  const [qty, setQty] = useState(100);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("services")
        .select("id,platform,service_type,price_per_unit,unit")
        .eq("active", true);
      setServices((data as Service[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = cat === "Semua" ? services : services.filter((s) => s.platform === cat);
  const cost = active ? (qty / active.unit) * active.price_per_unit : 0;

  async function launch() {
    if (!supabase || !active) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/daftar";
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("launch_campaign", {
      p_platform: active.platform,
      p_service_type: active.service_type,
      p_target_url: url,
      p_quantity: qty,
    });
    setBusy(false);
    if (error) {
      flash("❌ " + error.message);
    } else {
      flash("✅ Kempen dilancarkan! Lihat di Dashboard → Kempen Saya.");
      setActive(null);
      setUrl("");
    }
  }

  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Marketplace Kempen</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Pilih servis, masukkan pautan akaun, dan lancarkan kempen anda.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 font-medium ${
                cat === c
                  ? "bg-brand-500 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                  {EMOJI[s.platform] ?? "⭐"}
                </span>
                <div>
                  <p className="font-semibold">{s.platform}</p>
                  <p className="text-sm text-slate-500">{s.service_type}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-brand-500">{rm(s.price_per_unit)}</span>
                  <span className="text-sm text-slate-500"> / {s.unit}</span>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10">
                  Organik
                </span>
              </div>
              <button
                onClick={() => {
                  setActive(s);
                  setQty(s.unit);
                }}
                className="mt-4 rounded-xl bg-brand-500 py-2.5 text-center font-semibold text-white hover:bg-brand-600"
              >
                Lancar Kempen
              </button>
            </div>
          ))}
          {shown.length === 0 && (
            <p className="col-span-full py-12 text-center text-slate-400">Tiada servis dalam kategori ini.</p>
          )}
        </div>
      </section>

      {/* Launch modal */}
      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {EMOJI[active.platform]} {active.platform} — {active.service_type}
              </h3>
              <button onClick={() => setActive(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <label className="mt-5 block text-sm font-medium">Pautan akaun / post</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tiktok.com/@akaun_anda"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <label className="mt-4 block text-sm font-medium">Kuantiti</label>
            <input
              type="number"
              min={active.unit}
              step={active.unit}
              value={qty}
              onChange={(e) => setQty(Math.max(active.unit, Number(e.target.value)))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <span className="text-sm text-slate-500">Jumlah kos</span>
              <span className="text-xl font-bold text-brand-500">{rm(cost)}</span>
            </div>

            <button
              onClick={launch}
              disabled={busy || !url}
              className="mt-4 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? "Melancarkan…" : "Sahkan & Lancar (bayar dari wallet)"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Kos ditolak dari baki wallet. Topup di Dashboard jika perlu.
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
