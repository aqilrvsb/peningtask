import Link from "next/link";
import { Nav, Footer } from "@/components/site";

const ROWS = [
  { platform: "Facebook", emoji: "👍", services: "Page Likes, Followers", from: "RM 1.00 / 100" },
  { platform: "Threads", emoji: "🧵", services: "Followers, Likes", from: "RM 0.40 / 100" },
  { platform: "TikTok", emoji: "🎵", services: "Followers, Likes", from: "RM 0.40 / 100" },
  { platform: "Instagram", emoji: "📸", services: "Followers, Likes", from: "RM 0.35 / 100" },
];

export default function Harga() {
  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Harga Servis</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Tiada langganan. Tiada yuran tersembunyi. Bayar hanya untuk kempen yang anda lancar.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3">Servis</th>
                <th className="px-5 py-3 text-right">Harga bermula</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.platform} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-5 py-4 font-semibold">{r.emoji} {r.platform}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{r.services}</td>
                  <td className="px-5 py-4 text-right font-bold text-brand-500">{r.from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl bg-brand-50 p-6 text-center dark:bg-brand-500/10">
          <p className="font-semibold">Untuk pembuat tugasan 💸</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Daftar percuma, siapkan tugasan &amp; kumpul ganjaran tunai. Tiada modal diperlukan.
          </p>
          <Link href="/daftar" className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600">
            Daftar Percuma
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
