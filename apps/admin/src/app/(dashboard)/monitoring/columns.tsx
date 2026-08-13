"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

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

export const monitoringColumns = [
  columnHelper.accessor("date", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Date & Time</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
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
    cell: ({ getValue }) => {
      const status = getValue();
      if (status === "resolved") {
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500"
          >
            Resolved
          </Badge>
        );
      }
      if (status === "investigating") {
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            Investigating
          </Badge>
        );
      }
      return <Badge variant="destructive">Warning</Badge>;
    },
  }),
];
