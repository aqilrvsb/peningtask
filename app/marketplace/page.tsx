"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Nav, Footer } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";
import { PlatformIcon } from "@/components/icons";

type Job = {
  id: number;
  platform: string;
  action: string;
  reward: number;
  proof_types: string[];
  vendor_name: string | null;
  vendor_logo: string | null;
  created_at: string;
};

const CATS = ["Semua", "Facebook", "Threads", "Instagram", "YouTube", "TikTok"];
const ICON_KEY: Record<string, string> = {
  Facebook: "facebook",
  Threads: "threads",
  Instagram: "instagram",
  YouTube: "youtube",
  TikTok: "tiktok",
};

function rm(n: number) {
  return "RM " + Number(n || 0).toFixed(2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru sahaja";
  if (m < 60) return `${m} minit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function Marketplace() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cat, setCat] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!hasSupabase) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.rpc("public_recent_jobs");
      setJobs((data as Job[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const shown = useMemo(
    () => (cat === "Semua" ? jobs : jobs.filter((j) => j.platform === cat)),
    [jobs, cat]
  );

  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <span className="pj-eyebrow">Kerja Terkini</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Tugasan Tersedia Sekarang</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Pilih tugasan, siapkan dalam beberapa minit, dan dapat ganjaran terus ke wallet.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                cat === c
                  ? "bg-brand-gradient text-white shadow-glow-sm"
                  : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-20 text-center text-slate-400">Memuatkan tugasan…</p>
        ) : shown.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-white/10">
            <p className="text-4xl">📭</p>
            <p className="mt-3 font-semibold">Belum ada tugasan {cat !== "Semua" ? cat : ""} buat masa ini.</p>
            <p className="mt-1 text-sm text-slate-500">Tugasan baharu ditambah setiap hari — daftar supaya tak terlepas!</p>
            <Link href="/daftar" className="pj-btn-primary mt-5 inline-flex px-6 py-3">
              Daftar Percuma →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {shown.map((j) => (
              <div key={j.id} className="pj-card pj-card-hover flex flex-col p-5">
                <div className="flex items-center gap-3">
                  {j.vendor_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={j.vendor_logo} alt={j.vendor_name ?? ""} className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-white/10" />
                  ) : ICON_KEY[j.platform] ? (
                    <PlatformIcon name={ICON_KEY[j.platform]} size={44} />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 dark:bg-white/5">⭐</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold">{j.action}</p>
                    <p className="text-xs text-slate-500">
                      {j.platform} · oleh <b>{j.vendor_name ?? "PeningJob"}</b> · {timeAgo(j.created_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-gradient">{rm(j.reward)}</span>
                    <span className="text-xs text-slate-400"> / tugasan</span>
                  </div>
                  <Link href="/daftar" className="pj-btn-primary px-4 py-2">
                    Buat Tugasan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
