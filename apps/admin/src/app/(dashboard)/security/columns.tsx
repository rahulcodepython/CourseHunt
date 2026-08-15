"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

export type AccessLog = {
  time: string;
  user: string;
  action: string;
  ip: string;
  status: "success" | "failed" | "blocked";
};

const columnHelper = createColumnHelper<AccessLog>();

const statusMap: Record<string, StatusBadgeEntry> = {
  success: { label: "Success", variant: "secondary", className: "bg-emerald-500/10 text-emerald-500" },
  failed: { label: "Failed", variant: "destructive" },
  blocked: { label: "Blocked", variant: "outline", className: "border-amber-500/30 text-amber-500" },
};

export const securityColumns = [
  columnHelper.accessor("time", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Time" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("user", {
    header: "User",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("action", {
    header: "Action",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("ip", {
    header: "IP Address",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} map={statusMap} />,
  }),
];
