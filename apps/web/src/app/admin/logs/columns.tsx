"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

export type LogEntry = {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
  details: string;
};

const columnHelper = createColumnHelper<LogEntry>();

const levelMap: Record<string, StatusBadgeEntry> = {
  INFO: { label: "INFO", variant: "secondary", className: "bg-blue-500/10 text-blue-500" },
  WARN: { label: "WARN", variant: "outline", className: "border-amber-500/30 text-amber-500" },
  ERROR: { label: "ERROR", variant: "destructive" },
};

export const logsColumns = [
  columnHelper.accessor("timestamp", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Timestamp" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("level", {
    header: "Level",
    cell: ({ getValue }) => <StatusBadge status={getValue()} map={levelMap} />,
  }),
  columnHelper.accessor("source", {
    header: "Source",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("details", {
    header: "Details",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
];
