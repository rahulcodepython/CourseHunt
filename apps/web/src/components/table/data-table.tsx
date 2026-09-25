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
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/common/loading-button";
import { exportToCSV, exportToXLSX } from "@/lib/utils/csv";

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
}

/** Wraps a DataTable cell's content with click-to-copy and tooltip preview. */
function CopyableCell({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState("");

  React.useLayoutEffect(() => {
    setText(ref.current?.textContent?.trim() ?? "");
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='button'], [role='menuitem']"))
      return;
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const content = (
    <div ref={ref} onClick={handleClick} className={text ? "cursor-pointer" : undefined}>
      {children}
    </div>
  );

  if (!text) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

type ExportFormat = "csv" | "xlsx";

/** Exports displayed DataTable rows as CSV or XLSX. */
function ExportTableButton({
  containerRef,
  filename,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  filename: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    const container = containerRef.current;
    if (!container) return;

    const headers = Array.from(container.querySelectorAll("thead th")).map(
      (th) => th.textContent?.trim() ?? "",
    );
    const rows = Array.from(container.querySelectorAll("tbody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? ""),
    );

    setIsExporting(true);
    try {
      if (format === "csv") {
        exportToCSV(filename, headers, rows);
      } else {
        await exportToXLSX(filename, headers, rows);
      }
      setOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="flex gap-2" onClick={() => setOpen(true)}>
        <Icon name="download" className="size-4" />
        <span>Export</span>
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Export Table"
        description="Choose a file format to download the currently displayed rows."
      >
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="py-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="csv" id="export-format-csv" />
            <Label htmlFor="export-format-csv">CSV (.csv)</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="xlsx" id="export-format-xlsx" />
            <Label htmlFor="export-format-xlsx">Excel (.xlsx)</Label>
          </div>
        </RadioGroup>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <LoadingButton onClick={handleExport} loading={isExporting}>
            Download
          </LoadingButton>
        </DialogFooter>
      </FormDialog>
    </>
  );
}

/** Row-count status line for DataTable. */
function DataTablePagination<TData>({
  table,
  visibleCount,
}: {
  table: TanStackTable<TData>;
  visibleCount: number;
}) {
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
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const [filterInput, setFilterInput] = React.useState("");
  const debouncedFilter = useDebounce(filterInput, 300);

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
      pagination: { pageSize },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const canLoadMore = table.getCanNextPage();
  const visibleRows = table.getRowModel().rows;
  const visibleCount = (pageIndex + 1) * pageSize;
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
              <ExportTableButton containerRef={tableContainerRef} filename={exportFilename} />
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

      <div className="rounded-md border" ref={tableContainerRef}>
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
                  className="hover:bg-muted/40 transition-colors"
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
                      <CopyableCell>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </CopyableCell>
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

      {showPagination && <DataTablePagination table={table} visibleCount={visibleCount} />}
    </div>
  );
}
