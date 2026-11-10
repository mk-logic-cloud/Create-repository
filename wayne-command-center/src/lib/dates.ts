/** Date helpers that respect the user's IANA time zone. Dates are ISO strings (YYYY-MM-DD). */

export function todayInZone(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `isoDate`. */
export function startOfIsoWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const dow = d.getUTCDay() || 7; // 1 = Monday … 7 = Sunday
  return addDays(isoDate, 1 - dow);
}

export function isMonday(isoDate: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) && new Date(`${isoDate}T00:00:00Z`).getUTCDay() === 1;
}

/** Offset (ms) between UTC and the given zone at a specific instant. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** UTC instant of local midnight on `isoDate` in `timeZone` (DST-safe). */
export function zonedMidnightUtc(isoDate: string, timeZone: string): Date {
  const guess = new Date(`${isoDate}T00:00:00Z`);
  const first = new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
  const second = new Date(guess.getTime() - zoneOffsetMs(first, timeZone));
  return second;
}

export function weekRange(weekStart: string, timeZone: string) {
  const weekEnd = addDays(weekStart, 6);
  return {
    weekStart,
    weekEnd,
    fromUtc: zonedMidnightUtc(weekStart, timeZone).toISOString(),
    toUtc: zonedMidnightUtc(addDays(weekStart, 7), timeZone).toISOString(),
  };
}

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", timeZone: "UTC" });

export function formatDate(isoDate: string | null | undefined, short = false): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00Z` : isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return (short ? shortFmt : dateFmt).format(d);
}

export function formatDateTime(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

/** ISO-8601 calendar week number. */
export function isoWeek(isoDate: string): number {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
