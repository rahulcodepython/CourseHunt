"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { LogEntry } from "@/schema/logs.types";

const columnHelper = createColumnHelper<LogEntry>();

const successMap: Record<string, StatusBadgeEntry> = {
  true: { label: "Success", variant: "secondary", className: "bg-emerald-500/10 text-emerald-500" },
  false: { label: "Failed", variant: "destructive" },
};

export const logsColumns = [
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Timestamp" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDateTime(getValue())}</span>
    ),
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("actor_email", {
    header: "Actor",
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() ?? "Anonymous"}</span>,
  }),
  columnHelper.accessor("success", {
    header: "Result",
    cell: ({ getValue }) => <StatusBadge status={String(getValue())} map={successMap} />,
  }),
];
