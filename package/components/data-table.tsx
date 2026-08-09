"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Icon } from "@package/components/icon";

import { Button } from "@package/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@package/ui/table";
import { Skeleton } from "@package/ui/skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingRows = 6,
  emptyState,
  page = 1,
  totalPages = 1,
  onPageChange,
  totalCount,
}: DataTableProps<T>) {
  // Convert custom DataTableColumn to TanStack ColumnDef without selection column
  const tanstackColumns = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: () => col.header,
        cell: ({ row }) => col.cell(row.original),
        meta: {
          className: col.className,
          headerClassName: col.headerClassName,
        },
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const showPagination = Boolean(onPageChange && totalPages > 1);

  // Generate page numbers: 2 pages before current + current + 2 pages after current
  const pageNumbers = React.useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/40">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as {
                  headerClassName?: string;
                } | undefined;
                return (
                  <TableHead key={header.id} className={meta?.headerClassName}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-35" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center"
              >
                {emptyState ?? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="text-sm">No data available</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              return (
                <TableRow
                  key={keyExtractor(row.original)}
                  className="hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as {
                      className?: string;
                    } | undefined;
                    return (
                      <TableCell key={cell.id} className={meta?.className}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
            {totalCount !== undefined && ` · ${totalCount} total items`}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <Icon name="IconChevronLeft" className="size-4 mr-1" />
              Previous
            </Button>

            {/* Page Number Buttons: 2 previous + current + 2 next */}
            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="size-8 p-0 text-xs font-medium"
                onClick={() => onPageChange?.(p)}
              >
                {p}
              </Button>
            ))}

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <Icon name="IconChevronRight" className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
