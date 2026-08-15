"use client";

import * as React from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
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
import { Icon, type IconName } from "@/components/icon";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useDebounce } from "@/hooks/use-debounce";

export interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
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
}

export function DataTable<TData>({
    columns,
    data,
    searchPlaceholder,
    searchColumnKey,
    showColumnToggle = true,
    showPagination = true,
    pageSize = 10,
    emptyIcon = "file-text",
    emptyText = "No items found",
    isLoading = false,
    loadingText = "Loading...",
    toolbarActions,
}: DataTableProps<TData>) {
    const resolvedEmptyText = isLoading ? loadingText : emptyText;
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState("");

    // The input updates instantly; the table's filter state (which drives
    // the actual re-filter/re-render) only picks up the debounced value.
    const [searchInput, setSearchInput] = React.useState("");
    const debouncedSearch = useDebounce(searchInput, 300);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    React.useEffect(() => {
        if (searchColumnKey) {
            table.getColumn(searchColumnKey)?.setFilterValue(debouncedSearch);
        } else {
            setGlobalFilter(debouncedSearch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, searchColumnKey]);

    const showSearch = Boolean(searchPlaceholder || searchColumnKey);
    const showHeaderBar = showSearch || showColumnToggle || toolbarActions;

    return (
        <div className="space-y-4">
            {
                showHeaderBar && <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {
                        showSearch && <div className="relative max-w-sm flex-1">
                            <Icon
                                name="search"
                                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                placeholder={searchPlaceholder ?? "Search..."}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    }

                    <div className="flex items-center gap-2 ml-auto">
                        {toolbarActions}
                        {showColumnToggle && <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex gap-2">
                                    <Icon name="adjustments-horizontal" className="size-4" />
                                    <span>Columns</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {
                                    table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                        )
                                }
                            </DropdownMenuContent>
                        </DropdownMenu>
                        }
                    </div>
                </div>
            }

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {
                            table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>
                                {
                                    headerGroup.headers.map((header) => <TableHead key={header.id}>
                                        {
                                            header.isPlaceholder ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())
                                        }
                                    </TableHead>
                                    )
                                }
                            </TableRow>
                            )
                        }
                    </TableHeader>
                    <TableBody>
                        {
                            table.getRowModel().rows?.length ?
                                table.getRowModel().rows.map((row) => <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-muted/40 transition-colors"
                                >
                                    {
                                        row.getVisibleCells().map((cell) => <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                        )
                                    }
                                </TableRow>
                                )
                                : <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2 py-4">
                                            <Icon name={emptyIcon} className="size-8 opacity-40" />
                                            <p className="text-sm">{resolvedEmptyText}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                        }
                    </TableBody>
                </Table>
            </div>

            {showPagination && <DataTablePagination table={table} />}
        </div>
    );
}
