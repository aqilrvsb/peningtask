import Link from "next/link";
import { Nav, Footer } from "@/components/site";

const PLATFORMS = [
  { key: "facebook", name: "Facebook", from: "RM 1.00", emoji: "👍" },
  { key: "threads", name: "Threads", from: "RM 0.60", emoji: "🧵" },
  { key: "tiktok", name: "TikTok", from: "RM 0.60", emoji: "🎵" },
  { key: "instagram", name: "Instagram", from: "RM 0.60", emoji: "📸" },
  { key: "ai", name: "AI Task", from: "Ganjaran RM", emoji: "🤖" },
];

const STEPS = [
  {
    n: "1",
    title: "Pilih & Lancar Kempen",
    body: "Bisnes pilih platform dan cipta kempen. Tetapkan sasaran follow, like atau komen yang dikehendaki.",
  },
  {
    n: "2",
    title: "Komuniti Selesaikan Tugasan",
    body: "Ahli TugasKu yang aktif menyelesaikan tugasan ringkas mengikut arahan dan dibayar ganjaran tunai.",
  },
  {
    n: "3",
    title: "Engagement Sebenar Masuk",
    body: "Interaksi datang daripada akaun pengguna sebenar Malaysia — beransur & natural, bukan angka mendadak.",
  },
];

const FAQ = [
  {
    q: "Bagaimana ganjaran tugasan dikira?",
    a: "Setiap tugasan ada nilai ganjaran tersendiri yang dipaparkan sebelum anda mula. Selepas tugasan disahkan, ganjaran dikreditkan terus ke wallet anda.",
  },
  {
    q: "Berapa lama sesuatu kempen bermula?",
    a: "Kebanyakan kempen mula menerima interaksi dalam masa beberapa minit hingga beberapa jam bergantung kepada saiz dan platform.",
  },
  {
    q: "Bila saya boleh withdraw?",
    a: "Anda boleh memohon pengeluaran sebaik sahaja baki wallet mencapai nilai minimum. Pembayaran diproses ke akaun bank atau e-wallet anda.",
  },
  {
    q: "Siapa yang mengesahkan tugasan?",
    a: "Sistem kami menyemak bukti penyiapan setiap tugasan secara automatik, dengan semakan manual oleh pasukan untuk kes tertentu.",
  },
];

export default function Home() {
  return (
    <div>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-500/10 dark:via-slate-950 dark:to-slate-950">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-500/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:bg-brand-500/10">
            Komuniti tugasan &amp; engagement Malaysia
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Buat tugasan, kumpul ganjaran —{" "}
            <span className="text-brand-500">naikkan sosial anda</span> 🚀
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Selesaikan tugasan ringkas untuk pendapatan sampingan, atau tingkatkan
            engagement akaun anda dengan interaksi daripada pengguna sebenar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
            >
              Lihat Marketplace
            </Link>
            <Link
              href="/daftar"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Daftar Percuma
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Disertai ribuan pengguna aktif di seluruh Malaysia
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara" className="border-y border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-500">
              Telus &amp; Jelas
            </span>
            <h2 className="mt-2 text-3xl font-bold">Macam Mana Ia Berfungsi?</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Setiap interaksi datang daripada pengguna sebenar yang boleh dipercayai.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-lg font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {["100% akaun sebenar", "Bukan bot", "Penghantaran beransur (drip)"].map(
              (b) => (
                <span
                  key={b}
                  className="rounded-full bg-white px-4 py-1.5 font-medium text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300"
                >
                  ✓ {b}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* POPULAR PLATFORMS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            Popular
          </span>
          <h2 className="mt-2 text-3xl font-bold">Kempen Media Sosial Popular</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Pilih platform &amp; naikkan engagement anda hari ini.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PLATFORMS.map((p) => (
            <Link
              key={p.key}
              href={`/marketplace?category=${p.key}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-3xl">{p.emoji}</div>
              <p className="mt-3 font-semibold">{p.name}</p>
              <p className="text-sm text-slate-500">Mula {p.from}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-block rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
          >
            Lihat Semua Kempen
          </Link>
        </div>
      </section>

      {/* 3 WAYS */}
      <section className="border-y border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold">3 Cara Untuk Anda</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Beli servis, buat tugasan, atau jemput rakan — pilih cara anda.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                tag: "Harga Berpatutan",
                title: "Beli Kempen",
                body: "Naikkan follower, like & komen akaun anda dengan interaksi pengguna sebenar.",
                href: "/marketplace",
                cta: "Lihat Marketplace →",
              },
              {
                tag: "Ganjaran Terus",
                title: "Buat Tugasan",
                body: "Selesaikan tugasan ringkas dan kumpul ganjaran terus ke wallet anda.",
                href: "/daftar",
                cta: "Daftar & Mula →",
              },
              {
                tag: "10% Komisyen",
                title: "Jadi Affiliate",
                body: "Jemput rakan menyertai TugasKu dan dapat komisyen setiap pembelian mereka.",
                href: "/daftar",
                cta: "Daftar Sekarang →",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">
                  {c.tag}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {c.body}
                </p>
                <Link
                  href={c.href}
                  className="mt-4 font-semibold text-brand-500 hover:text-brand-600"
                >
                  {c.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">Soalan Lazim</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* GUIDELINE NOTE */}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <p className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ Kami tidak menerima tugasan yang melibatkan fitnah, penipuan atau
          perkara yang menjatuhkan pihak lain. Semua tugasan mesti mematuhi garis
          panduan platform.
        </p>
      </div>

      <Footer />
    </div>
  );
}
