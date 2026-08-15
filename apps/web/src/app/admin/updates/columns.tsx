"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { CourseUpdate } from "@/schema/updates.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<CourseUpdate>();

export const getColumns = (
  onEdit: (update: CourseUpdate) => void,
  onDelete: (update: CourseUpdate) => void,
) => [
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Date" />,
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
        <RowActions>
          <RowActionButton icon="pencil" label="Edit Update" onClick={() => onEdit(update)} />
          <RowActionButton icon="trash" label="Delete Update" onClick={() => onDelete(update)} destructive />
        </RowActions>
      );
    },
  }),
];
