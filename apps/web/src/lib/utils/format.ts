import { LOCALE_CONFIG } from "@/lib/const";

export function formatINR(value: number): string {
  return LOCALE_CONFIG.CURRENCY_SYMBOL + value.toLocaleString(LOCALE_CONFIG.LOCALE);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(LOCALE_CONFIG.LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(LOCALE_CONFIG.LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return value.slice(0, length) + LOCALE_CONFIG.ELLIPSIS;
}

/** "3m 45s" style duration, e.g. video/watch-time totals. */
export function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
