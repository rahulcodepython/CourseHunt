"use client";

import type { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export function SortableColumnHeader<TData, TValue>({
    column,
    label,
}: {
    column: Column<TData, TValue>;
    label: string;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            <span>{label}</span>
            <Icon name="arrow-up-down" className="ml-2 size-3.5" />
        </Button>
    );
}
