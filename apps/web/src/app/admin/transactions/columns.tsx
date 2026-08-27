"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Transaction } from "@/schema/transactions.types";
import { formatDateTime, formatINR, truncate } from "@/lib/format";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

const columnHelper = createColumnHelper<Transaction>();

const statusMap: Record<string, StatusBadgeEntry> = {
  success: { variant: "success" },
  confirmed: { variant: "success" },
  failed: { variant: "destructive" },
  refunded: { variant: "destructive" },
  pending: { variant: "outline" },
};

export const columns = [
  columnHelper.accessor("id", {
    header: "Transaction ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{truncate(getValue(), 14)}</span>
    ),
  }),
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Date" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {formatDateTime(getValue())}
      </span>
    ),
  }),
  columnHelper.accessor((row) => row.user.name, {
    id: "user",
    header: "User",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.course?.title ?? "—", {
    id: "course",
    header: "Course",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor((row) => row.coupon?.code || "—", {
    id: "coupon",
    header: "Coupon",
    cell: ({ getValue }) => {
      const code = getValue();
      return code === "—" ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="font-mono text-xs">{code}</span>
      );
    },
  }),
  columnHelper.accessor("amount", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Amount" />,
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">
        {formatINR(getValue() || 0)}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} map={statusMap} />,
    filterFn: (row, id, value) => {
      return value === "all" ? true : row.getValue(id) === value;
    },
  }),
];
