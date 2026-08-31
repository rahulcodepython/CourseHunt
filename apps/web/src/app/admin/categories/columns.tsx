"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Category } from "@/schema/category.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Category>();

export const getColumns = (
  allCategories: Category[],
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Category Name" />,
    cell: ({ getValue, row }) => (
      <div className="flex items-center gap-1.5">
        {row.getCanExpand() ? (
          <button
            type="button"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? "Collapse subcategories" : "Expand subcategories"}
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
          >
            <Icon
              name="chevron-right"
              className={cn("size-4 transition-transform", row.getIsExpanded() && "rotate-90")}
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <span className="font-semibold">{getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("created_at", {
    header: "Created Date",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue() ? formatDate(getValue()) : "—"}
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
      <span className="tabular-nums font-medium">{getValue()?.length ?? 0} items</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const category = row.original;
      return (
        <RowActions>
          <RowActionButton icon="pencil" label="Edit Category" onClick={() => onEdit(category)} />
          <RowActionButton
            icon="trash"
            label="Delete Category"
            onClick={() => onDelete(category)}
            destructive
          />
        </RowActions>
      );
    },
  }),
];
