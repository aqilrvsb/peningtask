import Link from "next/link";
import { Nav, Footer } from "@/components/site";
import { PlatformIcon } from "@/components/icons";

const PLATFORMS = [
  { key: "facebook", name: "Facebook", from: "RM 1.00" },
  { key: "threads", name: "Threads", from: "RM 0.60" },
  { key: "instagram", name: "Instagram", from: "RM 0.60" },
  { key: "youtube", name: "YouTube", from: "RM 1.00" },
  { key: "tiktok", name: "TikTok", from: "RM 0.60" },
];

const STEPS = [
  {
    n: "1",
    title: "Pilih & Lancar Kempen",
    body: "Bisnes pilih platform dan cipta kempen. Tetapkan sasaran follow, like atau komen yang dikehendaki.",
    icon: "🎯",
  },
  {
    n: "2",
    title: "Komuniti Selesaikan Tugasan",
    body: "Ahli PeningJob yang aktif menyelesaikan tugasan ringkas mengikut arahan dan dibayar ganjaran tunai.",
    icon: "⚡",
  },
  {
    n: "3",
    title: "Engagement Sebenar Masuk",
    body: "Interaksi datang daripada akaun pengguna sebenar Malaysia — beransur & natural, bukan angka mendadak.",
    icon: "📈",
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
    a: "Vendor menyemak bukti untuk kempen mereka sendiri, dengan pengawasan pasukan admin untuk memastikan ketelusan.",
  },
];

const STATS = [
  { v: "74K+", l: "Pengguna aktif" },
  { v: "1.2M", l: "Tugasan siap" },
  { v: "RM380K", l: "Ganjaran dibayar" },
  { v: "24 jam", l: "Proses withdraw" },
];

export default function Home() {
  return (
    <div>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pj-grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-0 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <div className="flex justify-center animate-fade-up">
            <span className="pj-eyebrow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Komuniti tugasan &amp; engagement #1 Malaysia
            </span>
          </div>

          <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight animate-fade-up sm:text-6xl" style={{ animationDelay: "60ms" }}>
            Buat tugasan, kumpul{" "}
            <span className="text-gradient">ganjaran tunai</span> — naikkan sosial anda 🚀
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 animate-fade-up dark:text-slate-300" style={{ animationDelay: "120ms" }}>
            Selesaikan tugasan ringkas untuk pendapatan sampingan, atau tingkatkan
            engagement akaun anda dengan interaksi daripada pengguna sebenar.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
            <Link href="/daftar" className="pj-btn-primary px-7 py-3.5 text-base">
              Mula Percuma →
            </Link>
            <Link href="/marketplace" className="pj-btn-ghost px-7 py-3.5 text-base">
              Lihat Marketplace
            </Link>
          </div>

          {/* social proof */}
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-500 animate-fade-up dark:text-slate-400" style={{ animationDelay: "240ms" }}>
            <div className="flex -space-x-2">
              {["🧑🏻", "👩🏽", "🧑🏾", "👨🏻", "👩🏻"].map((e, i) => (
                <span key={i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-100 text-sm dark:border-slate-900">
                  {e}
                </span>
              ))}
            </div>
            Disertai <b className="text-slate-700 dark:text-slate-200">74,258+</b> pengguna
          </div>

          {/* supported platforms */}
          <div className="mt-8 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: "270ms" }}>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Menyokong</span>
            <div className="flex items-center gap-3">
              {["facebook", "threads", "instagram", "youtube", "tiktok"].map((k) => (
                <PlatformIcon key={k} name={k} size={44} className="transition hover:-translate-y-1" />
              ))}
            </div>
          </div>

          {/* stat bar */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 animate-fade-up sm:grid-cols-4" style={{ animationDelay: "300ms" }}>
            {STATS.map((s) => (
              <div key={s.l} className="pj-card px-4 py-5">
                <p className="text-2xl font-extrabold text-gradient">{s.v}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <span className="pj-eyebrow">Telus &amp; Jelas</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Macam Mana Ia Berfungsi?</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-600 dark:text-slate-300">
            Setiap interaksi datang daripada pengguna sebenar yang boleh dipercayai.
          </p>
        </div>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent md:block" />
          {STEPS.map((s) => (
            <div key={s.n} className="pj-card pj-card-hover relative p-7">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-2xl shadow-glow-sm">
                {s.icon}
              </div>
              <div className="absolute right-6 top-6 text-5xl font-black text-slate-100 dark:text-white/5">
                {s.n}
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3 text-sm">
          {["100% akaun sebenar", "Bukan bot", "Penghantaran beransur (drip)"].map((b) => (
            <span key={b} className="pj-card px-4 py-2 font-medium text-slate-600 dark:text-slate-300">
              ✓ {b}
            </span>
          ))}
        </div>
      </section>

      {/* POPULAR PLATFORMS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="pj-eyebrow">Popular</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Kempen Media Sosial Popular</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Pilih platform &amp; naikkan engagement anda hari ini.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p) => (
            <Link key={p.key} href={`/marketplace?category=${p.key}`} className="pj-card pj-card-hover group p-6 text-center">
              <div className="mx-auto w-fit transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                <PlatformIcon name={p.key} size={56} />
              </div>
              <p className="mt-4 font-bold">{p.name}</p>
              <p className="text-sm text-slate-500">Mula {p.from}</p>
            </Link>
          ))}
        </div>
        <div className="mt-9 text-center">
          <Link href="/marketplace" className="pj-btn-primary px-6 py-3">
            Lihat Semua Kempen →
          </Link>
        </div>
      </section>

      {/* 3 WAYS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="pj-eyebrow">3 Cara Untuk Anda</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Satu platform, tiga peluang</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Beli servis, buat tugasan, atau jemput rakan — pilih cara anda.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { tag: "Untuk Bisnes", icon: "📣", title: "Beli Kempen", body: "Naikkan follower, like & komen akaun anda dengan interaksi pengguna sebenar.", href: "/marketplace", cta: "Lihat Marketplace" },
            { tag: "Ganjaran Terus", icon: "💸", title: "Buat Tugasan", body: "Selesaikan tugasan ringkas dan kumpul ganjaran terus ke wallet anda.", href: "/daftar", cta: "Daftar & Mula" },
            { tag: "10% Komisyen", icon: "🤝", title: "Jadi Affiliate", body: "Jemput rakan menyertai PeningJob dan dapat komisyen setiap pembelian mereka.", href: "/daftar", cta: "Daftar Sekarang" },
          ].map((c) => (
            <div key={c.title} className="pj-card pj-card-hover group relative flex flex-col overflow-hidden p-7">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-400/10 blur-2xl transition group-hover:bg-brand-400/20" />
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-2xl dark:bg-white/5">{c.icon}</div>
              <span className="mt-4 w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                {c.tag}
              </span>
              <h3 className="mt-3 text-xl font-bold">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{c.body}</p>
              <Link href={c.href} className="mt-5 inline-flex items-center gap-1 font-semibold text-brand-600 transition group-hover:gap-2 dark:text-brand-400">
                {c.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white shadow-glow">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
          <h2 className="relative mx-auto max-w-xl text-3xl font-extrabold sm:text-4xl">
            Sedia untuk mula jana pendapatan?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/90">
            Daftar percuma dalam 30 saat. Tiada modal, tiada kad kredit.
          </p>
          <Link href="/daftar" className="relative mt-7 inline-flex rounded-xl bg-white px-8 py-3.5 font-bold text-brand-600 shadow-lg transition hover:scale-[1.03]">
            Daftar Percuma →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <span className="pj-eyebrow">Soalan Lazim</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Ada soalan?</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="pj-card group p-5 [&_svg]:open:rotate-45">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                {f.q}
                <svg className="h-5 w-5 shrink-0 text-brand-500 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* GUIDELINE NOTE */}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <p className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-center text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ Kami tidak menerima tugasan yang melibatkan fitnah, penipuan atau
          perkara yang menjatuhkan pihak lain. Semua tugasan mesti mematuhi garis
          panduan platform.
        </p>
      </div>

      <Footer />
    </div>
  );
}
