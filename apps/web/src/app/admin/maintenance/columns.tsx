"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

export type MaintenanceRecord = {
  id: string;
  dateTime: string;
  services: string[];
  message: string;
  duration: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
};

const columnHelper = createColumnHelper<MaintenanceRecord>();

const statusMap: Record<string, StatusBadgeEntry> = {
  ongoing: { label: "Ongoing", variant: "destructive", className: "animate-pulse gap-1", dot: true },
  upcoming: { label: "Upcoming", variant: "secondary", className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Completed", variant: "secondary", className: "bg-emerald-500/10 text-emerald-500" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export const getColumns = (
  onCancel: (record: MaintenanceRecord) => void,
  onResume: (record: MaintenanceRecord) => void,
) => [
  columnHelper.accessor("dateTime", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Date / Time" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("services", {
    header: "Services",
    cell: ({ getValue }) => {
      const services = getValue() || [];
      return (
        <div className="flex flex-wrap gap-1">
          {services.map((s) => (
            <Badge key={s} variant="secondary" className="font-mono text-xs">
              {s}
            </Badge>
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => (
      <span className="block max-w-xs truncate text-muted-foreground">
        {getValue() || "—"}
      </span>
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
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const record = row.original;
      if (record.status === "upcoming") {
        return (
          <RowActions>
            <RowActionButton icon="x" label="Cancel Maintenance" onClick={() => onCancel(record)} destructive />
          </RowActions>
        );
      }
      if (record.status === "ongoing") {
        return (
          <RowActions>
            <RowActionButton
              icon="server"
              label="Resume Services"
              onClick={() => onResume(record)}
              className="text-emerald-600 hover:text-emerald-700"
            />
          </RowActions>
        );
      }
      return <div className="text-right text-xs text-muted-foreground">—</div>;
    },
  }),
];
