import Link from "next/link";
import { Nav, Footer } from "@/components/site";

const SERVICES = [
  { id: 1, platform: "TikTok", emoji: "🎵", type: "Followers", price: "RM 0.60", unit: "/ 100" },
  { id: 2, platform: "TikTok", emoji: "🎵", type: "Likes", price: "RM 0.40", unit: "/ 100" },
  { id: 3, platform: "Instagram", emoji: "📸", type: "Followers", price: "RM 0.60", unit: "/ 100" },
  { id: 4, platform: "Instagram", emoji: "📸", type: "Likes", price: "RM 0.35", unit: "/ 100" },
  { id: 5, platform: "Facebook", emoji: "👍", type: "Page Likes", price: "RM 1.00", unit: "/ 100" },
  { id: 6, platform: "Facebook", emoji: "👍", type: "Followers", price: "RM 1.00", unit: "/ 100" },
  { id: 7, platform: "YouTube", emoji: "▶️", type: "Subscribers", price: "RM 1.20", unit: "/ 100" },
  { id: 8, platform: "YouTube", emoji: "▶️", type: "Views", price: "RM 0.50", unit: "/ 1000" },
  { id: 9, platform: "Threads", emoji: "🧵", type: "Followers", price: "RM 0.60", unit: "/ 100" },
  { id: 10, platform: "Twitter / X", emoji: "𝕏", type: "Followers", price: "RM 1.00", unit: "/ 100" },
];

export default function Marketplace() {
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
          {["Semua", "TikTok", "Instagram", "Facebook", "YouTube", "Threads", "Twitter / X"].map(
            (c, i) => (
              <button
                key={c}
                className={`rounded-full px-4 py-1.5 font-medium ${
                  i === 0
                    ? "bg-brand-500 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {c}
              </button>
            )
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                  {s.emoji}
                </span>
                <div>
                  <p className="font-semibold">{s.platform}</p>
                  <p className="text-sm text-slate-500">{s.type}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-brand-500">{s.price}</span>
                  <span className="text-sm text-slate-500"> {s.unit}</span>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10">
                  Organik
                </span>
              </div>
              <Link
                href="/daftar"
                className="mt-4 rounded-xl bg-brand-500 py-2.5 text-center font-semibold text-white hover:bg-brand-600"
              >
                Lancar Kempen
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
