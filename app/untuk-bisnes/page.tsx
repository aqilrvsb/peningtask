import Link from "next/link";
import { Nav, Footer } from "@/components/site";

const BENEFITS = [
  { icon: "🎯", title: "Engagement Pengguna Sebenar", body: "Setiap follow, like & komen datang daripada ahli komuniti kami yang sahih — bukan bot." },
  { icon: "🐢", title: "Penghantaran Beransur", body: "Interaksi masuk secara natural mengikut masa, bukan lonjakan mendadak yang mencurigakan." },
  { icon: "💰", title: "Bayar Ikut Guna", body: "Topup wallet & bayar hanya untuk kempen yang anda lancar. Tiada langganan bulanan." },
  { icon: "📊", title: "Progres Telus", body: "Pantau setiap kempen secara live — berapa dihantar, berapa lagi baki, semua jelas." },
];

const STEPS = [
  "Daftar akaun bisnes anda (percuma)",
  "Topup wallet mengikut bajet",
  "Pilih platform & lancar kempen di Marketplace",
  "Pantau progres live di Dashboard",
];

export default function UntukBisnes() {
  return (
    <div>
      <Nav />
      <section className="bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-500/10 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Naikkan Bisnes Anda dengan <span className="text-brand-500">Komuniti Sebenar</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Facebook, Threads, TikTok &amp; Instagram — engagement organik daripada
            pengguna Malaysia untuk brand anda.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/daftar" className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600">
              Mula Sekarang
            </Link>
            <Link href="/marketplace" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Lihat Harga Servis
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-slate-50 p-8 dark:bg-slate-900">
          <h2 className="text-center text-2xl font-bold">Cara Mula — 4 Langkah</h2>
          <ol className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-3 rounded-2xl bg-white p-4 dark:bg-slate-950">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link href="/daftar" className="inline-block rounded-xl bg-brand-500 px-8 py-3 font-semibold text-white hover:bg-brand-600">
              Daftar Akaun Bisnes →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
