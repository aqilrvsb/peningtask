"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="tk" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#be185d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#tk)" />
      <path
        d="M12 20.5l5 5 11-11.5"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <LogoMark size={size} />
      <span>
        Pening<span className="text-brand-500">Job</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="Tukar mod"
      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 text-base transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

const NAV = [
  { href: "/", label: "Utama" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/untuk-bisnes", label: "Untuk Bisnes" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/blog", label: "Blog" },
  { href: "/#faq", label: "Soalan Lazim" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pj-glass sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/60 bg-white/50 p-1 text-sm font-medium text-slate-600 lg:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-brand-600 hover:shadow-sm dark:hover:bg-white/10"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/log-masuk"
            className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block dark:text-slate-200 dark:hover:bg-white/10"
          >
            Log Masuk
          </Link>
          <Link href="/daftar" className="pj-btn-primary px-4 py-2">
            Daftar Percuma
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 lg:hidden dark:border-white/10 dark:bg-white/5"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200/70 px-4 py-2 lg:hidden dark:border-white/10">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-10 border-t border-slate-200/70 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Komuniti tugasan ganjaran &amp; engagement organik Malaysia. Telus,
            dipercayai, withdraw pantas.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/marketplace" className="hover:text-brand-500">Marketplace</Link></li>
            <li><Link href="/untuk-bisnes" className="hover:text-brand-500">Untuk Bisnes</Link></li>
            <li><Link href="/harga" className="hover:text-brand-500">Harga</Link></li>
            <li><Link href="/tentang" className="hover:text-brand-500">Tentang Kami</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Akaun</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/daftar" className="hover:text-brand-500">Daftar Percuma</Link></li>
            <li><Link href="/log-masuk" className="hover:text-brand-500">Log Masuk</Link></li>
            <li><Link href="/dashboard" className="hover:text-brand-500">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Sokongan</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/#faq" className="hover:text-brand-500">Soalan Lazim</Link></li>
            <li><Link href="/polisi" className="hover:text-brand-500">Polisi &amp; Privasi</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400 dark:border-white/10">
        © 2026 PeningJob. Dibina dengan ❤️ di Malaysia.
      </div>
    </footer>
  );
}
