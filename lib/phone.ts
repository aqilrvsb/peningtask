// Single source of truth for Malaysian phone normalization.
// Used by BOTH the client (register) and the server (TAC send/verify) so the
// phone stored/verified always matches the phone sent to signUp.
//
// Accepts any common input and returns canonical "60XXXXXXXXX":
//   "0108924904"   -> "60108924904"
//   "108924904"    -> "60108924904"
//   "60108924904"  -> "60108924904"
//   "+60 10-892 4904" -> "60108924904"
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^0-9]/g, "");
  if (!p) return "";
  // strip a leading 60 (country code) so we work from the local part
  if (p.startsWith("60")) p = p.slice(2);
  // strip a single leading local-trunk 0 (e.g. 012...)
  if (p.startsWith("0")) p = p.slice(1);
  return "60" + p;
}

export function validMyPhone(p: string): boolean {
  // 60 + 8..11 digits (covers 01X-XXXXXXX mobile & landlines)
  return /^60\d{8,11}$/.test(p);
}
