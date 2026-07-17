"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Nav, Footer } from "@/components/site";
import { createClient, hasSupabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

const STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
const BENEFITS = [
  { icon: "🎯", title: "Real Malaysian Audience", body: "Reach thousands of active community members who complete your engagement tasks genuinely." },
  { icon: "🔒", title: "Escrow Protection", body: "Your reward pool is held safely — workers are only paid when you approve their proof." },
  { icon: "📊", title: "Full Control", body: "Set quota, reward, evidence type, deadline & instructions. Approve or reject every submission." },
  { icon: "💸", title: "Pay Per Campaign", body: "No subscription. Pay only for the jobs you publish — with a transparent quotation upfront." },
];
const STEPS_HOW = ["Register your company (free)", "Create a job & get an instant quotation", "Pay & upload your receipt", "Admin approves → your job goes live", "Review proofs & approve to release rewards"];

export default function SertaiVendor() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function requestTac(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null);
    if (!company || !address || !district || !state) return setErr("Please fill in all company details.");
    if (!hasSupabase) return setErr("System not connected.");
    setLoading(true);
    try {
      const res = await fetch("/api/tac/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json(); setLoading(false);
      if (!j.ok) return setErr(j.error || "Failed to send code.");
      setMsg(`TAC sent to ${phone}.`); setStep("otp"); setCooldown(60);
    } catch { setLoading(false); setErr("Network error."); }
  }
  async function resend() {
    if (cooldown > 0) return; setErr(null);
    const res = await fetch("/api/tac/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const j = await res.json();
    if (!j.ok) setErr(j.error); else { setMsg("New code sent."); setCooldown(60); }
  }
  async function verifyAndRegister(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const vres = await fetch("/api/tac/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const vj = await vres.json().catch(() => ({ ok: false }));
      if (!vj.ok) { setLoading(false); return setErr(vj.error || "Invalid or expired code."); }
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: company, whatsapp: normalizePhone(phone), account_type: "vendor" }, emailRedirectTo: `${window.location.origin}/vendor` },
      });
      if (error) { setLoading(false); return setErr(error.message === "{}" ? "Registration failed — email may already be used." : error.message); }
      if (data.user) {
        await supabase.from("profiles").update({
          business_name: company, company_name: company, company_address: address, company_district: district, company_state: state,
        }).eq("id", data.user.id);
      }
      setLoading(false);
      if (data.session) window.location.href = "/vendor";
      else setMsg("Vendor account created! Please log in.");
    } catch { setLoading(false); setErr("Unexpected error."); }
  }

  return (
    <div>
      <Nav />
      <section className="relative overflow-hidden">
        <div className="pj-grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-16 top-0 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="pj-eyebrow">For Business</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Grow your brand with <span className="text-gradient">real engagement</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-300">
              Publish engagement jobs (Facebook, Instagram, TikTok, YouTube, Threads, Shopee) and get genuine interactions from Malaysia&apos;s active community.
            </p>
            <button onClick={() => setOpen(true)} className="pj-btn-primary mt-7 px-7 py-3.5 text-base">Daftar Vendor →</button>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="pj-card p-5">
                  <div className="text-2xl">{b.icon}</div>
                  <h3 className="mt-2 font-bold">{b.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{b.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-3xl border border-white/60 shadow-card ring-1 ring-brand-200/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vendor-hero.png" alt="Grow your business with PeningJob" className="w-full" />
            </div>
          <div className="pj-card mt-5 p-8 shadow-card">
            <h2 className="text-xl font-bold">How it works</h2>
            <ol className="mt-4 space-y-3">
              {STEPS_HOW.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
                  <span className="pt-1 text-sm font-medium">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-center dark:bg-brand-500/10">
              <p className="font-bold">Ready to start?</p>
              <p className="mt-1 text-sm text-slate-500">Registration is free — you only pay per job.</p>
              <button onClick={() => setOpen(true)} className="pj-btn-primary mt-4 px-6 py-2.5">Register Now</button>
            </div>
          </div>
          </div>
        </div>
      </section>
      <Footer />

      {/* Register modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="pj-card my-8 w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Vendor Registration</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
            </div>
            <p className="mt-1 text-sm text-slate-500">{step === "form" ? "Tell us about your company." : "Enter the 6-digit code sent to your phone."}</p>

            {step === "form" ? (
              <form onSubmit={requestTac} className="mt-5 space-y-3">
                <input required placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} className="pj-input" />
                <input required placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="pj-input" />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="District (Daerah)" value={district} onChange={(e) => setDistrict(e.target.value)} className="pj-input" />
                  <select required value={state} onChange={(e) => setState(e.target.value)} className="pj-input">
                    <option value="">State…</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <input type="tel" required inputMode="numeric" placeholder="Phone Number (for TAC)" value={phone} onChange={(e) => setPhone(e.target.value)} className="pj-input" />
                <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pj-input" />
                <input type="password" required minLength={6} placeholder="Password (min. 6)" value={password} onChange={(e) => setPassword(e.target.value)} className="pj-input" />
                <button disabled={loading} className="pj-btn-primary w-full py-3.5">{loading ? "Sending code…" : "Send TAC Code →"}</button>
              </form>
            ) : (
              <form onSubmit={verifyAndRegister} className="mt-5 space-y-4">
                <input inputMode="numeric" maxLength={6} required placeholder="_ _ _ _ _ _" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} className="pj-input text-center text-2xl font-bold tracking-[0.5em]" />
                <button disabled={loading} className="pj-btn-primary w-full py-3.5">{loading ? "Verifying…" : "Verify & Register"}</button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setStep("form"); setErr(null); setCode(""); }} className="text-slate-500 hover:underline">← Edit details</button>
                  <button type="button" onClick={resend} disabled={cooldown > 0} className="font-semibold text-brand-600 disabled:text-slate-400 dark:text-brand-400">{cooldown > 0 ? `Resend (${cooldown}s)` : "Resend code"}</button>
                </div>
              </form>
            )}

            {msg && !err && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-center text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{msg}</p>}
            {err && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{err}</p>}
            <p className="mt-5 text-center text-sm text-slate-500">Already a vendor? <Link href="/log-masuk" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Log in</Link></p>
          </div>
        </div>
      )}
    </div>
  );
}
