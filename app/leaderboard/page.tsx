"use client";

import { useEffect, useState } from "react";
import { Nav, Footer } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";

type Row = { rank: number; name: string; level: number; tasks_done: number; earned: number };

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!hasSupabase) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.rpc("leaderboard");
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">🏆 Papan Pendahulu</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Top 10 pengguna paling banyak menjana ganjaran di PeningJob.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <p className="p-10 text-center text-slate-400">Memuatkan…</p>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-slate-400">
              Belum ada data. Jadilah yang pertama — daftar &amp; buat tugasan! 🚀
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Tugasan</th>
                  <th className="px-4 py-3 text-right">Diperoleh</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rank} className={`border-t border-slate-100 dark:border-slate-800 ${r.rank <= 3 ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}>
                    <td className="px-4 py-3 text-lg">{MEDALS[r.rank - 1] ?? r.rank}</td>
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3">Lv {r.level} ⭐</td>
                    <td className="px-4 py-3">{r.tasks_done}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-500">
                      RM {Number(r.earned).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
