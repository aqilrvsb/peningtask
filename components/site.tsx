"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="tk" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
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
        Tugas<span className="text-brand-500">Ku</span>
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
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

const NAV = [
  { href: "/", label: "Utama" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/untuk-bisnes", label: "Untuk Bisnes" },
  { href: "/#cara", label: "Cara Berfungsi" },
  { href: "/#faq", label: "Soalan Lazim" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/log-masuk"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:block dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log Masuk
          </Link>
          <Link
            href="/daftar"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Daftar
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 md:hidden dark:border-slate-700"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
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
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
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
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
        © 2026 TugasKu. Dibina di Malaysia.
      </div>
    </footer>
  );
}
