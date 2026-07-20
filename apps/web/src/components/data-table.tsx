"use client";

import { Button } from "@package/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    emptyState?: ReactNode;
    loadingSkeleton?: ReactNode;
    label?: string;
}

const getPageNumbers = (page: number, totalPages: number) => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
};

function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading,
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
    emptyState,
    loadingSkeleton,
    label = "items",
}: DataTableProps<T>) {
    if (isLoading && data.length === 0) {
        return loadingSkeleton ?? null;
    }

    if (data.length === 0) {
        return emptyState ?? (
            <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-2xl bg-muted/10">
                <p className="text-lg font-medium">No data found</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead key={i} className={col.headerClassName}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={keyExtractor(item)}>
                            {columns.map((col, i) => (
                                <TableCell key={i} className={cn(col.className)}>{col.render(item)}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {
                totalPages > 0 && <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} {label}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                            Previous
                        </Button>
                        {
                            getPageNumbers(page, totalPages).map((p) => <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => onPageChange(p)}>
                                {p}
                            </Button>
                            )
                        }
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            }
        </>
    );
}

export { DataTable };
