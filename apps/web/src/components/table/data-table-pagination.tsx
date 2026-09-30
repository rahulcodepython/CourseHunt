"use client";

import * as React from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  visibleCount: number;
  totalCount?: number;
}

/** Row-count status line for DataTable. */
export function DataTablePagination<TData>({
  table,
  visibleCount,
  totalCount,
}: DataTablePaginationProps<TData>) {
  const filteredLength = table.getFilteredRowModel().rows.length;
  const total = totalCount ?? filteredLength;
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-center px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{Math.min(visibleCount, total)}</span>{" "}
        of <span className="font-medium text-foreground">{total}</span> results
      </p>
    </div>
  );
}
