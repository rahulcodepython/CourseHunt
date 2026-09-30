"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  type Table as TanStackTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/common/icon";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils/utils";
import { ExportTableButton } from "./data-table-export";
import { DataTablePagination } from "./data-table-pagination";

export type TableColumns<TData> = Parameters<typeof useReactTable<TData>>[0]["columns"];
export type TableColumn<TData> = TableColumns<TData>[number];

export interface DataTableProps<TData> {
  columns: TableColumns<TData>;
  data: TData[];
  searchPlaceholder?: string;
  searchColumnKey?: string;
  showColumnToggle?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  emptyIcon?: IconName;
  emptyText?: string;
  /** When true, shows `loadingText` in place of `emptyText` instead of every caller hand-writing that ternary. */
  isLoading?: boolean;
  loadingText?: string;
  toolbarActions?: React.ReactNode;
  /** Base filename (no extension) used by the Export button's CSV/XLSX download. */
  exportFilename?: string;
  /** When provided, rows expand to reveal nested children (e.g. category -> subcategories) instead of a flat list. */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** Infinite scroll callback when scrolling near the end of the table */
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  totalCount?: number;
  /** Optional click handler for entire row */
  onRowClick?: (row: TData) => void;
}


export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Filter records...",
  searchColumnKey,
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  emptyIcon = "file-text",
  emptyText = "No results found",
  isLoading = false,
  loadingText = "Loading...",
  toolbarActions,
  exportFilename,
  getSubRows,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  totalCount,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const [filterInput, setFilterInput] = React.useState("");
  const debouncedFilter = useDebounce(filterInput, 300);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: onLoadMore ?? (() => {}),
  });

  React.useEffect(() => {
    if (searchColumnKey) {
      table.getColumn(searchColumnKey)?.setFilterValue(debouncedFilter);
    } else {
      setGlobalFilter(debouncedFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilter, searchColumnKey]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: { pageSize: onLoadMore ? 10000 : pageSize },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const canLoadMore = table.getCanNextPage();
  const visibleRows = table.getRowModel().rows;
  const visibleCount = onLoadMore ? visibleRows.length : (pageIndex + 1) * pageSize;
  const resolvedEmptyText = isLoading ? loadingText : emptyText;

  return (
    <div className="space-y-4">
      {(searchPlaceholder || showColumnToggle || toolbarActions || exportFilename) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            {searchPlaceholder && (
              <div className="relative max-w-sm flex-1">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder={searchPlaceholder}
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            {toolbarActions}
          </div>

          <div className="flex items-center gap-2">
            {exportFilename && (
              <ExportTableButton table={table} filename={exportFilename} />
            )}
            {showPagination && canLoadMore && (
              <Button
                variant="outline"
                size="sm"
                className="flex gap-2"
                onClick={() => table.setPageIndex(pageIndex + 1)}
              >
                <Icon name="chevron-down" className="size-4" />
                <span>Load More</span>
              </Button>
            )}
            {showColumnToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2">
                    <Icon name="adjustments-horizontal" className="size-4" />
                    <span>Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visibleRows.length ? (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "hover:bg-muted/40 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, a, input, [role='menuitem'], [data-prevent-row-click]")) {
                      return;
                    }
                    onRowClick?.(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      style={
                        cellIndex === 0 && row.depth > 0
                          ? { paddingLeft: `${row.depth * 1.5 + 1}rem` }
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Icon name={emptyIcon} className="size-8 opacity-40" />
                    <p className="text-sm">{resolvedEmptyText}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {onLoadMore && hasNextPage && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Icon name="refresh" className="size-4 animate-spin" />
              <span>Loading more records...</span>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Load more
            </Button>
          )}
        </div>
      )}

      {showPagination && (
        <DataTablePagination table={table} visibleCount={visibleCount} totalCount={totalCount} />
      )}
    </div>
  );
}
