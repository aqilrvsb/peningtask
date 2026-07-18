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
    title: "Daftar & Pilih Tugasan",
    body: "Daftar percuma dengan pengesahan TAC, kemudian pilih tugasan ringkas — follow, like atau komen — yang anda suka.",
    img: "/step1.webp",
  },
  {
    n: "2",
    title: "Siapkan & Hantar Bukti",
    body: "Selesaikan tugasan dalam beberapa minit, muat naik bukti (gambar/video/link), dan hantar untuk semakan.",
    img: "/step2.webp",
  },
  {
    n: "3",
    title: "Dapat Ganjaran & Withdraw",
    body: "Ganjaran masuk terus ke wallet anda selepas disahkan. Kumpul XP, naik level, dan withdraw ke bank bila-bila masa.",
    img: "/step3.webp",
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

function FeatureCard({
  img,
  badge,
  tag,
  title,
  body,
  cta,
  href,
}: {
  img: string;
  badge?: string;
  tag?: string;
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="pj-card pj-card-hover group flex flex-col overflow-hidden p-0">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        {badge && (
          <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-base font-black text-brand-600 shadow-soft backdrop-blur">
            {badge}
          </span>
        )}
        {tag && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-600 shadow-soft backdrop-blur">
            {tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{body}</p>
        {cta && href && (
          <Link href={href} className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 transition group-hover:gap-2 dark:text-brand-400">
            {cta} →
          </Link>
        )}
      </div>
    </div>
  );
}

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

          {/* hero showcase media */}
          <div className="mx-auto mt-14 max-w-4xl animate-fade-up" style={{ animationDelay: "290ms" }}>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/40 p-2 shadow-card ring-1 ring-brand-200/50 backdrop-blur">
              <div className="pointer-events-none absolute -inset-8 -z-10 bg-brand-400/20 blur-3xl" />
              <video
                src="/hero.mp4"
                poster="/hero.webp"
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-[1.35rem]"
              />
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
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <FeatureCard key={s.n} img={s.img} badge={s.n} title={s.title} body={s.body} />
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
          <span className="pj-eyebrow">Platform</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Buat Tugasan di Platform Kegemaran</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Tugasan tersedia setiap hari — pilih platform yang anda sudah biasa guna.
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
          <span className="pj-eyebrow">Untuk Komuniti</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Cara Komuniti Kami Menang</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Buat tugasan, naik level, dan jemput rakan — pendapatan makin bertambah.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { img: "/cara1.webp", tag: "Ganjaran Terus", title: "Buat Tugasan", body: "Selesaikan tugasan ringkas ikut masa lapang anda dan kumpul ganjaran tunai terus ke wallet.", href: "/daftar", cta: "Daftar & Mula" },
            { img: "/cara2.webp", tag: "Gamifikasi", title: "Naik Level & Leaderboard", body: "Setiap tugasan beri XP. Naik level, panjat leaderboard, dan tunjuk pencapaian anda.", href: "/leaderboard", cta: "Lihat Leaderboard" },
            { img: "/cara3.webp", tag: "10% Komisyen", title: "Jemput Rakan", body: "Kongsi link anda — dapat RM0.10 setiap rakan daftar + komisyen berterusan.", href: "/daftar", cta: "Daftar Sekarang" },
          ].map((c) => (
            <FeatureCard key={c.title} img={c.img} tag={c.tag} title={c.title} body={c.body} href={c.href} cta={c.cta} />
          ))}
        </div>
      </section>

      {/* COMMUNITY STORIES */}
      <section id="kisah" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="pj-eyebrow">Kisah Komuniti</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Dibina untuk komuniti kami</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-600 dark:text-slate-300">
            Ribuan rakyat Malaysia guna PeningJob untuk jana pendapatan sampingan mengikut gaya hidup mereka.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { img: "/kisah1.webp", who: "Pelajar", body: "Tukar masa scroll antara kelas jadi duit poket. Tiada modal, buat ikut masa lapang." },
            { img: "/kisah2.webp", who: "Suri Rumah", body: "Jana pendapatan dari rumah sambil uruskan keluarga — beberapa minit sehari sudah memadai." },
            { img: "/kisah3.webp", who: "Pekerja Part-time", body: "Income tambahan waktu malam & hujung minggu, terus masuk wallet dan withdraw ke bank." },
            { img: "/kisah4.webp", who: "Peminat Sosial", body: "Kenali cara engagement organik berfungsi dari dalam — sambil dibayar untuk masa anda." },
          ].map((s) => (
            <FeatureCard key={s.who} img={s.img} title={s.who} body={s.body} />
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Segmen di atas adalah contoh ilustrasi cara komuniti menggunakan PeningJob.
        </p>
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
