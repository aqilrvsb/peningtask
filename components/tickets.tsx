"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/compress";

type Ticket = { id: number; type: string; subject: string | null; status: string; client_name?: string | null; updated_at: string };
type Msg = { id: number; sender_id: string; sender_name: string | null; body: string | null; image_url: string | null; created_at: string };
type JobOpt = { submission_id: number; action: string; platform: string };
type WdOpt = { id: number; amount: number; status: string };

export function TicketCenter({
  supabase,
  mode,
  jobs = [],
  withdrawals = [],
}: {
  supabase: SupabaseClient;
  mode: "client" | "vendor" | "admin";
  jobs?: JobOpt[];
  withdrawals?: WdOpt[];
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [me, setMe] = useState<string>("");
  const [reply, setReply] = useState("");
  const [replyImg, setReplyImg] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // create form (client only)
  const [creating, setCreating] = useState(false);
  const [cType, setCType] = useState<"job" | "withdrawal">("job");
  const [cRef, setCRef] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cBody, setCBody] = useState("");
  const [cImg, setCImg] = useState<File | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const listFn = mode === "client" ? "my_tickets" : mode === "vendor" ? "vendor_tickets" : "admin_tickets";

  const loadTickets = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    setMe(auth.user?.id ?? "");
    const { data } = await supabase.rpc(listFn);
    setTickets((data as Ticket[]) ?? []);
  }, [supabase, listFn]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTicket = useCallback(async (id: number) => {
    setActive(id);
    const { data } = await supabase.rpc("ticket_thread", { p_tid: id });
    setThread((data as Msg[]) ?? []);
  }, [supabase]);

  async function uploadImg(file: File): Promise<string | null> {
    const compact = await compressImage(file);
    const { data: auth } = await supabase.auth.getUser();
    const ext = compact.name.split(".").pop() || "jpg";
    const path = `${auth.user!.id}/${crypto.randomUUID().slice(0, 10)}.${ext}`;
    const { error } = await supabase.storage.from("tickets").upload(path, compact);
    if (error) { flash("❌ Upload failed"); return null; }
    return supabase.storage.from("tickets").getPublicUrl(path).data.publicUrl;
  }

  async function sendReply() {
    if (!active || (!reply.trim() && !replyImg)) return;
    setBusy(true);
    let img: string | null = null;
    if (replyImg) { img = await uploadImg(replyImg); if (!img) { setBusy(false); return; } }
    const { error } = await supabase.rpc("ticket_reply", { p_tid: active, p_body: reply || null, p_image_url: img });
    setBusy(false);
    if (error) return flash("❌ " + error.message);
    setReply(""); setReplyImg(null);
    openTicket(active); loadTickets();
  }

  async function closeTicket() {
    if (!active) return;
    const { error } = await supabase.rpc("close_ticket", { p_tid: active });
    if (error) return flash("❌ " + error.message);
    flash("Ticket closed"); openTicket(active); loadTickets();
  }

  async function createTicket() {
    if (!cRef) return flash("⚠️ Select the related " + cType);
    if (!cBody.trim()) return flash("⚠️ Add a description");
    setBusy(true);
    let img: string | null = null;
    if (cImg) { img = await uploadImg(cImg); if (!img) { setBusy(false); return; } }
    const { error } = await supabase.rpc("create_ticket", { p_type: cType, p_ref: Number(cRef), p_subject: cSubject || null, p_body: cBody, p_image_url: img });
    setBusy(false);
    if (error) return flash("❌ " + error.message);
    flash("✅ Ticket opened");
    setCreating(false); setCRef(""); setCSubject(""); setCBody(""); setCImg(null);
    loadTickets();
  }

  const activeTicket = tickets.find((t) => t.id === active);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* list */}
      <div className="lg:col-span-1">
        {mode === "client" && (
          <button onClick={() => setCreating(true)} className="pj-btn-primary mb-3 w-full py-2.5">+ New Ticket</button>
        )}
        <div className="space-y-2">
          {tickets.length === 0 && <p className="pj-card p-6 text-center text-sm text-slate-400">No tickets.</p>}
          {tickets.map((t) => (
            <button key={t.id} onClick={() => openTicket(t.id)} className={`pj-card w-full p-4 text-left transition ${active === t.id ? "ring-2 ring-brand-400" : "hover:shadow-card"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.type === "job" ? "bg-accent-500/10 text-accent-600" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{t.type}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.status === "closed" ? "bg-slate-100 text-slate-500 dark:bg-white/10" : "bg-brand-50 text-brand-600 dark:bg-brand-500/10"}`}>{t.status}</span>
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold">{t.subject || `Ticket #${t.id}`}</p>
              {t.client_name && <p className="text-xs text-slate-400">{t.client_name}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* thread */}
      <div className="lg:col-span-2">
        {!active ? (
          <p className="pj-card grid h-full min-h-[300px] place-items-center p-10 text-center text-slate-400">Select a ticket to view the conversation.</p>
        ) : (
          <div className="pj-card flex h-full min-h-[400px] flex-col p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <p className="font-semibold">{activeTicket?.subject || `Ticket #${active}`}</p>
              {activeTicket?.status !== "closed" && <button onClick={closeTicket} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50 dark:border-white/10">Close</button>}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {thread.map((m) => {
                const mine = m.sender_id === me;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand-gradient text-white" : "bg-slate-100 dark:bg-white/10"}`}>
                      {!mine && <p className="mb-0.5 text-xs font-bold opacity-70">{m.sender_name}</p>}
                      {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                      {m.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a href={m.image_url} target="_blank"><img src={m.image_url} alt="attachment" className="mt-2 max-h-40 rounded-lg" /></a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {activeTicket?.status !== "closed" && (
              <div className="border-t border-slate-100 p-3 dark:border-white/10">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write a reply…" className="w-full rounded-xl px-4 py-2.5 text-sm" />
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-white/10">📎 Image<input type="file" accept="image/*" className="hidden" onChange={(e) => setReplyImg(e.target.files?.[0] ?? null)} /></label>
                  {replyImg && <span className="text-xs text-brand-500">✓ {replyImg.name}</span>}
                  <button onClick={sendReply} disabled={busy} className="pj-btn-primary ml-auto px-5 py-1.5">{busy ? "…" : "Send"}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setCreating(false)}>
          <div className="pj-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">New Support Ticket</h3><button onClick={() => setCreating(false)} className="text-slate-400">✕</button></div>
            <label className="mt-4 block text-sm font-medium">Type</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["job", "withdrawal"] as const).map((t) => (
                <button key={t} onClick={() => { setCType(t); setCRef(""); }} className={`rounded-xl border-2 p-3 text-sm font-bold capitalize ${cType === t ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"}`}>{t === "job" ? "🧩 Job" : "💸 Withdrawal"}</button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium">Select {cType}</label>
            <select value={cRef} onChange={(e) => setCRef(e.target.value)} className="mt-1 w-full rounded-xl px-4 py-2.5">
              <option value="">— choose —</option>
              {cType === "job" ? jobs.map((j) => <option key={j.submission_id} value={j.submission_id}>{j.platform} · {j.action}</option>)
                : withdrawals.map((w) => <option key={w.id} value={w.id}>RM {Number(w.amount).toFixed(2)} · {w.status}</option>)}
            </select>
            <label className="mt-4 block text-sm font-medium">Subject</label>
            <input value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="Short summary" className="mt-1 w-full rounded-xl px-4 py-2.5" />
            <label className="mt-4 block text-sm font-medium">Description *</label>
            <textarea value={cBody} onChange={(e) => setCBody(e.target.value)} rows={3} placeholder="Describe your issue…" className="mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
            <label className="mt-4 block text-sm font-medium">Attach image</label>
            <input type="file" accept="image/*" onChange={(e) => setCImg(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-white/10" />
            <button onClick={createTicket} disabled={busy} className="pj-btn-primary mt-5 w-full py-3">{busy ? "Sending…" : cType === "job" ? "Send to Vendor" : "Send to Admin"}</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">{toast}</div>}
    </div>
  );
}
