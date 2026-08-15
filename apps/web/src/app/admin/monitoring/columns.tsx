"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

export type SystemEventLog = {
  id: string;
  date: string;
  time: string;
  service: string;
  event: string;
  duration: string;
  status: "resolved" | "investigating" | "warning";
};

const columnHelper = createColumnHelper<SystemEventLog>();

const statusMap: Record<string, StatusBadgeEntry> = {
  resolved: { label: "Resolved", variant: "secondary", className: "bg-emerald-500/10 text-emerald-500" },
  investigating: { label: "Investigating", variant: "outline", className: "border-amber-500/30 text-amber-500" },
  warning: { label: "Warning", variant: "destructive" },
};

export const monitoringColumns = [
  columnHelper.accessor("date", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Date & Time" />,
    cell: ({ row }) => (
      <div className="flex flex-col text-xs font-mono">
        <span className="font-semibold">{row.original.date}</span>
        <span className="text-muted-foreground">{row.original.time}</span>
      </div>
    ),
  }),
  columnHelper.accessor("service", {
    header: "Service",
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="font-mono">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("event", {
    header: "Event / Spike",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("duration", {
    header: "Duration",
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
