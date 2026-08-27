"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/icon";
import { useCursorFeed } from "@/hooks/use-cursor-feed";
import { fetchNotifications } from "@/query-hooks/notifications.api";
import { queryKeys } from "@/react-query/query-keys";
import { formatDateTime } from "@/lib/format";
import useSession from "@/hooks/use-session";
import { ROLES } from "@/lib/const";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

const NOTIFICATION_ROUTES: Record<string, string> = {
    [ROLES.ADMIN]: "/admin/notifications",
    [ROLES.TUTOR]: "/tutor/notifications",
};

// Mounted once in GenericDashboardLayout's header — persists across every
// dashboard page for a session, which is what gives this feed its
// "polls continuously in the background, not just on the notifications
// page" behavior for free.
export function NotificationBell() {
    const { user } = useSession();
    const role = user?.role ?? "";
    const enabled = role === ROLES.ADMIN || role === ROLES.TUTOR;

    const { items, refresh, isFetching } = useCursorFeed(
        queryKeys.notificationsFeedBell(),
        fetchNotifications,
        { limit: 10, refetchInterval: enabled ? POLL_INTERVAL_MS : undefined },
    );

    const [open, setOpen] = React.useState(false);
    const [seenCount, setSeenCount] = React.useState(0);

    React.useEffect(() => {
        if (open) setSeenCount(items.length);
    }, [open, items.length]);

    if (!enabled) return null;

    const unseen = Math.max(0, items.length - seenCount);
    const recent = items.slice(0, 10);
    const href = NOTIFICATION_ROUTES[role] ?? "/";

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-8" aria-label="Notifications">
                    <Icon name="bell" className="size-4" />
                    {unseen > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {unseen > 9 ? "9+" : unseen}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b p-3">
                    <p className="text-sm font-medium">Notifications</p>
                    <Button variant="ghost" size="sm" className="h-7 px-2" disabled={isFetching} onClick={() => refresh()}>
                        <Icon name="refresh" className="size-3.5" />
                    </Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {recent.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
                    ) : (
                        recent.map((n) => (
                            <div key={n.id} className="border-b px-3 py-2 last:border-b-0">
                                <p className="text-sm">{n.message}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t p-2">
                    <Link
                        href={href}
                        className="block text-center text-xs font-medium text-primary hover:underline"
                        onClick={() => setOpen(false)}
                    >
                        View all
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
