import type { StatusBadgeEntry } from "@/components/status-badge";

/** Shared banned/active status map for the users, tutors, and admins tables. */
export const bannedStatusMap: Record<string, StatusBadgeEntry> = {
    banned: { label: "Banned", variant: "destructive" },
    active: { label: "Active", variant: "secondary", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
};
