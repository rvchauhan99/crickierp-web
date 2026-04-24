import { getSessionUser } from "@/services/sessionStore";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/** Session timezone, else browser IANA zone, else Asia/Kolkata (matches API `X-User-Timezone`). */
export function resolveUserTimeZone(): string {
  const sessionTz = getSessionUser()?.timezone?.trim();
  if (sessionTz) return sessionTz;
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
    if (browserTz) return browserTz;
  } catch {
    // ignore and fallback
  }
  return DEFAULT_TIMEZONE;
}

/** Calendar `YYYY-MM-DD` for `date` in the given IANA timezone (not UTC `toISOString`). */
export function formatYyyyMmDdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
