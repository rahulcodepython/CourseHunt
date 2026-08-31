"use client";

import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  /** Rows actually rendered so far (cumulative "Load More" reveal), vs. table's own filtered row count. */
  visibleCount: number;
}

/** Row-count status line — "Load More" itself lives in the table's toolbar, next to the Columns button. */
export function DataTablePagination<TData>({
  table,
  visibleCount,
}: DataTablePaginationProps<TData>) {
  const total = table.getFilteredRowModel().rows.length;

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
