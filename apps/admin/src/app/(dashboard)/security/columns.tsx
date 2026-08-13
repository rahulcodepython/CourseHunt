"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export type AccessLog = {
  time: string;
  user: string;
  action: string;
  ip: string;
  status: "success" | "failed" | "blocked";
};

const columnHelper = createColumnHelper<AccessLog>();

export const securityColumns = [
  columnHelper.accessor("time", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Time</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
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
    cell: ({ getValue }) => {
      const status = getValue();
      if (status === "success") {
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500"
          >
            Success
          </Badge>
        );
      }
      if (status === "failed") {
        return <Badge variant="destructive">Failed</Badge>;
      }
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          Blocked
        </Badge>
      );
    },
  }),
];
