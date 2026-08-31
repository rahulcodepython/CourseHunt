"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { RefundTransaction } from "@/schema/transactions.types";
import { formatDateTime, formatINR, truncate } from "@/lib/format";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

const columnHelper = createColumnHelper<RefundTransaction>();

const refundStatusMap: Record<string, StatusBadgeEntry> = {
    processed: { variant: "success" },
    refunded: { variant: "success" },
    failed: { variant: "destructive" },
    pending: { variant: "outline" },
};

export const refundColumns = [
    columnHelper.accessor((row) => row.razorpay_refund_id || row.id, {
        id: "refund_id",
        header: "Refund ID",
        cell: ({ getValue }) => <span className="font-mono text-xs">{truncate(getValue(), 16)}</span>,
    }),
    columnHelper.accessor("created_at", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Date" />,
        cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatDateTime(getValue())}</span>
        ),
    }),
    columnHelper.accessor((row) => row.user.name, {
        id: "user",
        header: "User",
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.user.name || "—"}</div>
                <div className="text-xs text-muted-foreground">{row.original.user.email || ""}</div>
            </div>
        ),
    }),
    columnHelper.accessor((row) => row.course?.title ?? "—", {
        id: "course",
        header: "Course",
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    }),
    columnHelper.accessor("amount", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Amount" />,
        cell: ({ getValue }) => (
            <span className="font-medium tabular-nums">{formatINR(getValue() || 0)}</span>
        ),
    }),
    columnHelper.accessor("refund_status", {
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={getValue()} map={refundStatusMap} />,
        filterFn: (row, id, value) => {
            return value === "all" ? true : row.getValue(id) === value;
        },
    }),
    columnHelper.accessor("duplicate_of", {
        header: "Duplicate Of (Tx ID)",
        cell: ({ getValue }) => {
            const dup = getValue();
            return dup ? <span className="font-mono text-xs text-amber-600 dark:text-amber-400">{truncate(dup, 14)}</span>
            : <span className="text-muted-foreground">—</span>
        },
    }),
];
