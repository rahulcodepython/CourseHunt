"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Category } from "@/schema/category.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<Category>();

export const getColumns = (
  allCategories: Category[],
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Category Name</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
  }),
  columnHelper.accessor("created_at", {
    header: "Created Date",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
      </span>
    ),
  }),
  columnHelper.accessor("parent_id", {
    header: "Parent Category",
    cell: ({ getValue }) => {
      const parentId = getValue();
      if (!parentId) {
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Top Level
          </Badge>
        );
      }
      const parent = allCategories.find((c) => c.id === parentId);
      return (
        <Badge variant="outline" className="font-medium">
          {parent?.name ?? parentId}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("subcategories", {
    header: "Subcategories",
    cell: ({ getValue }) => (
      <span className="tabular-nums font-medium">
        {getValue()?.length ?? 0} items
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onEdit(category)}
            aria-label="Edit category"
          >
            <Icon name="pencil" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(category)}
            aria-label="Delete category"
          >
            <Icon name="trash" className="size-4" />
          </Button>
        </div>
      );
    },
  }),
];
