"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/common/icon";
import { SortableColumnHeader } from "@/components/table/sortable-column-header";
import { useCursorFeed } from "@/hooks/use-cursor-feed";
import { fetchNotifications } from "@/query-hooks/notifications.api";
import { queryKeys } from "@/react-query/query-keys";
import { formatDateTime } from "@/lib/utils/format";
import type { Notification } from "@/schema/notifications.types";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

const typeIcon: Record<string, IconName> = {
  login: "lock",
  purchase: "credit-card",
  discussion: "messages",
  feedback: "star",
  system_error: "shield",
  enrollment: "book",
  course_update: "bell",
  coupon: "ticket",
  payout: "credit-card",
  system: "info-circle",
};

const columnHelper = createColumnHelper<Notification>();

const notificationsColumns = [
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Time" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDateTime(getValue())}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => {
      const type = getValue();
      const iconName = typeIcon[type] ?? "bell";
      return (
        <Badge variant="secondary" className="gap-1 capitalize">
          <Icon name={iconName} className="size-3" />
          {type.replace("_", " ")}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
];

// Shared by /admin/notifications and /tutor/notifications — the backend
// already filters rows by the caller's role, so the same table works
// unmodified for both.
export function NotificationsFeedTable() {
  const { items, loadMore, hasMore, refresh, isLoading, isFetching } = useCursorFeed(
    queryKeys.notificationsFeed(),
    fetchNotifications,
    { limit: 10, refetchInterval: POLL_INTERVAL_MS },
  );

  return (
    <DataTable
      columns={notificationsColumns}
      data={items}
      searchPlaceholder="Search notifications..."
      emptyIcon="bell"
      emptyText="No notifications yet"
      isLoading={isLoading}
      exportFilename="notifications"
      onLoadMore={loadMore}
      hasNextPage={hasMore}
      isFetchingNextPage={isFetching}
      toolbarActions={
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refresh()}>
          <Icon name="refresh" className="size-4" />
          Refresh
        </Button>
      }
    />
  );
}
