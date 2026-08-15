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
