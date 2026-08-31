"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { RefundTransaction } from "@/schema/transactions.types";
import { formatDateTime, formatINR, truncate } from "@/lib/format";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

const columnHelper = createColumnHelper<RefundTransaction>();

const refundStatusMap: Record<string, StatusBadgeEntry> = {
  processed: { variant: "success" },
  refunded: { variant: "success" },
  failed: { variant: "destructive" },
  pending: { variant: "outline" },
};

export const refundColumns: ColumnDef<RefundTransaction, any>[] = [
  columnHelper.accessor((row) => row.razorpay_refund_id || row.id, {
    id: "refund_id",
    header: "Refund ID",
    cell: ({ getValue }) => <span className="font-mono text-xs">{truncate(getValue(), 20)}</span>,
  }),
  columnHelper.accessor("created_at", {
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDateTime(getValue())}</span>
    ),
  }),
  columnHelper.accessor((row) => row.course?.title ?? "Unknown", {
    id: "course",
    header: "Course",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">{formatINR(getValue() || 0)}</span>
    ),
  }),
  columnHelper.accessor("refund_status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} map={refundStatusMap} />,
  }),
  columnHelper.accessor("duplicate_of", {
    header: "Duplicate Of",
    cell: ({ getValue }) => {
      const dup = getValue();
      return dup ? (
        <span className="font-mono text-xs text-amber-600 dark:text-amber-400">{truncate(dup, 16)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  }),
];
