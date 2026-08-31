"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Lesson } from "@/schema/lessons.types";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Lesson>();

const lessonTypeBadge: Record<string, { label: string; className: string }> = {
  video: {
    label: "Video",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  },
  document: {
    label: "Document",
    className: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  },
  quiz: {
    label: "Quiz",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

export const getColumns = (courseId: string, chapterId: string) => [
  columnHelper.accessor("lesson_no", {
    header: "#",
    cell: ({ getValue }) => (
      <div className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
        {getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Title" />,
    cell: ({ row }) => {
      const lesson = row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{lesson.title}</span>
          <Badge className={cn("shrink-0", lessonTypeBadge[lesson.lesson_type]?.className)}>
            {lessonTypeBadge[lesson.lesson_type]?.label ?? lesson.lesson_type}
          </Badge>
        </div>
      );
    },
  }),
  columnHelper.accessor("short_description", {
    header: "Description",
    cell: ({ getValue }) => (
      <span className="line-clamp-1 text-sm text-muted-foreground">
        {getValue() || "No description"}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const lesson = row.original;
      const basePath = `/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`;
      return (
        <RowActions>
          <RowActionButton
            icon="star"
            label="View Feedback"
            href={`${basePath}/feedback`}
            iconClassName="text-amber-500 fill-amber-500"
          />
          <RowActionButton
            icon="messages"
            label="View Discussions"
            href={`${basePath}/discussions`}
            iconClassName="text-primary"
          />
        </RowActions>
      );
    },
  }),
];
