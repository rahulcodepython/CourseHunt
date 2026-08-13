"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { CourseUpdate } from "@/schema/updates.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<CourseUpdate>();

export const getColumns = (
  onEdit: (update: CourseUpdate) => void,
  onDelete: (update: CourseUpdate) => void,
) => [
  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Date</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => (
      <span className="block max-w-xs truncate text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("course", {
    header: "Scope",
    cell: ({ getValue }) => {
      const course = getValue();
      return course ? (
        <Badge variant="secondary">{course.title}</Badge>
      ) : (
        <Badge variant="default">Platform-wide</Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const update = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onEdit(update)}
            aria-label="Edit update"
          >
            <Icon name="pencil" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(update)}
            aria-label="Delete update"
          >
            <Icon name="trash" className="size-4" />
          </Button>
        </div>
      );
    },
  }),
];
