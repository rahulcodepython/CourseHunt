"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Chapter } from "@/schema/chapters.types";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { formatDuration } from "@/lib/format";

const columnHelper = createColumnHelper<Chapter>();

export const getColumns = (courseId: string) => [
  columnHelper.accessor("chapter_no", {
    header: "#",
    cell: ({ getValue }) => (
      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Title" />,
    cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
  }),
  columnHelper.accessor("total_lectures", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Lessons" />,
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()} lessons</span>,
  }),
  columnHelper.accessor("total_duration_seconds", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Watch Time" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground tabular-nums">{formatDuration(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const chapter = row.original;
      return (
        <RowActions>
          <RowActionButton
            icon="book"
            label="View Lessons"
            href={`/admin/courses/${courseId}/chapters/${chapter.id}/lessons`}
          />
        </RowActions>
      );
    },
  }),
];
