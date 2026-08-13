"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Transaction } from "@/schema/transactions.types";
import { formatDateTime, formatINR, truncate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<Transaction>();

const statusBadge: Record<string, "success" | "destructive" | "outline"> = {
  confirmed: "success",
  refunded: "destructive",
  pending: "outline",
};

export const columns = [
  columnHelper.accessor("id", {
    header: "Transaction ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{truncate(getValue(), 14)}</span>
    ),
  }),
  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Date</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
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
  columnHelper.accessor("amount", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Amount</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">
        {formatINR(getValue() || 0)}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge
          variant={statusBadge[status] ?? "outline"}
          className="capitalize"
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === "all" ? true : row.getValue(id) === value;
    },
  }),
];
