"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export type LogEntry = {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
  details: string;
};

const columnHelper = createColumnHelper<LogEntry>();

export const logsColumns = [
  columnHelper.accessor("timestamp", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Timestamp</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("level", {
    header: "Level",
    cell: ({ getValue }) => {
      const level = getValue();
      if (level === "INFO") {
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            INFO
          </Badge>
        );
      }
      if (level === "WARN") {
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            WARN
          </Badge>
        );
      }
      return <Badge variant="destructive">ERROR</Badge>;
    },
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
