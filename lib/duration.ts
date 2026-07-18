// Job duration formatting — always displayed in Asia/Kuala_Lumpur (GMT+8).
const KL = "Asia/Kuala_Lumpur";

const klDay = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: KL, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const klDate = (d: Date) =>
  new Intl.DateTimeFormat("en-MY", { timeZone: KL, day: "numeric", month: "short", year: "numeric" }).format(d);
const klTime = (d: Date) =>
  new Intl.DateTimeFormat("en-MY", { timeZone: KL, hour: "numeric", minute: "2-digit", hour12: true }).format(d);

// Human duration, e.g. "20 Jul 2026 · All day" or "20–25 Jul 2026 · 2:00 PM–6:00 PM"
export function formatDuration(startISO?: string | null, endISO?: string | null, allDay?: boolean | null): string {
  if (!endISO) return "—";
  const end = new Date(endISO);
  const start = startISO ? new Date(startISO) : end;
  if (isNaN(end.getTime())) return "—";
  const sameDay = klDay(start) === klDay(end);
  const datePart = sameDay ? klDate(start) : `${klDate(start)} – ${klDate(end)}`;
  if (allDay) return `${datePart} · All day`;
  return `${datePart} · ${klTime(start)}–${klTime(end)}`;
}

// Build a KL-timezone ISO instant from a yyyy-mm-dd date + HH:MM time (GMT+8, no DST).
export function klISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00+08:00`).toISOString();
}
