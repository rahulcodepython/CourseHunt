"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export type MaintenanceRecord = {
  id: string;
  dateTime: string;
  services: string[];
  message: string;
  duration: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
};

const columnHelper = createColumnHelper<MaintenanceRecord>();

export const getColumns = (
  onCancel: (record: MaintenanceRecord) => void,
  onResume: (record: MaintenanceRecord) => void,
) => [
  columnHelper.accessor("dateTime", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Date / Time</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("services", {
    header: "Services",
    cell: ({ getValue }) => (
      <div className="flex flex-wrap gap-1">
        {getValue().map((s) => (
          <Badge key={s} variant="secondary" className="font-mono text-xs">
            {s}
          </Badge>
        ))}
      </div>
    ),
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
    cell: ({ getValue }) => {
      const status = getValue();
      if (status === "ongoing") {
        return (
          <Badge variant="destructive" className="animate-pulse gap-1">
            <span className="size-1.5 rounded-full bg-white" />
            Ongoing
          </Badge>
        );
      }
      if (status === "upcoming") {
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            Upcoming
          </Badge>
        );
      }
      if (status === "completed") {
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500"
          >
            Completed
          </Badge>
        );
      }
      return <Badge variant="outline">Cancelled</Badge>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const record = row.original;
      if (record.status === "upcoming") {
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={() => onCancel(record)}
            >
              <Icon name="x" className="size-3.5" />
              <span>Cancel</span>
            </Button>
          </div>
        );
      }
      if (record.status === "ongoing") {
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
              onClick={() => onResume(record)}
            >
              <Icon name="server" className="size-3.5" />
              <span>Resume Services</span>
            </Button>
          </div>
        );
      }
      return <div className="text-right text-xs text-muted-foreground">—</div>;
    },
  }),
];
