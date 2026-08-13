"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  if (pageCount <= 1 && table.getFilteredRowModel().rows.length <= table.getState().pagination.pageSize) {
    return null;
  }

  // Calculate page number buttons to show: up to 2 before, current, up to 2 after
  const pages: number[] = [];
  const startPage = Math.max(0, pageIndex - 2);
  const endPage = Math.min(pageCount - 1, pageIndex + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row">
      <div className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {table.getFilteredRowModel().rows.length === 0
            ? 0
            : pageIndex * table.getState().pagination.pageSize + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {Math.min(
            (pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {table.getFilteredRowModel().rows.length}
        </span>{" "}
        results
      </div>
      <div className="flex items-center space-x-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="h-8 gap-1 text-xs"
        >
          <Icon name="chevron-left" className="size-3.5" />
          <span>Previous</span>
        </Button>

        {pages.map((p) => {
          const isCurrent = p === pageIndex;
          return (
            <Button
              key={p}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              onClick={() => table.setPageIndex(p)}
              className="h-8 w-8 p-0 text-xs"
            >
              {p + 1}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="h-8 gap-1 text-xs"
        >
          <span>Next</span>
          <Icon name="chevron-right" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
