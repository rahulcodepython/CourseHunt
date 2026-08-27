"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@/schema/transactions.types";
import { formatDateTime, formatINR, truncate } from "@/lib/format";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";
import { InvoiceDownloadButton } from "./invoice-pdf";

const columnHelper = createColumnHelper<Transaction>();

const statusMap: Record<string, StatusBadgeEntry> = {
  success: { variant: "success" },
  confirmed: { variant: "success" },
  failed: { variant: "destructive" },
  refunded: { variant: "destructive" },
  pending: { variant: "outline" },
};

export const columns: ColumnDef<Transaction, any>[] = [
  columnHelper.accessor((row) => row.razorpay_order_id || row.id, {
    id: "transaction_id",
    header: "Transaction ID",
    cell: ({ getValue }) => <span className="font-mono text-xs">{truncate(getValue(), 20)}</span>,
  }),
  columnHelper.accessor("created_at", {
    header: "Date",
    cell: ({ getValue }) => <span className="text-muted-foreground">{formatDateTime(getValue())}</span>,
  }),
  columnHelper.accessor((row) => row.course?.title ?? "Unknown", {
    id: "course",
    header: "Course",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatINR(getValue() || 0)}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} map={statusMap} />,
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <InvoiceDownloadButton transaction={row.original} />
      </div>
    ),
  }),
];
