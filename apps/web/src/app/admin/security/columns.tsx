"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { formatDateTime } from "@/lib/format";
import type { SecurityEvent } from "@/schema/security.types";

const columnHelper = createColumnHelper<SecurityEvent>();

export const securityColumns = [
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Time" />,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDateTime(getValue())}</span>
    ),
  }),
  columnHelper.accessor("email", {
    header: "User",
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() ?? "Anonymous"}</span>,
  }),
  columnHelper.accessor("ip_address", {
    header: "IP Address",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("path", {
    header: "Path",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("user_agent", {
    header: "User Agent",
    cell: ({ getValue }) => (
      <span
        className="max-w-64 truncate text-xs text-muted-foreground"
        title={getValue() ?? undefined}
      >
        {getValue() ?? "—"}
      </span>
    ),
  }),
];
