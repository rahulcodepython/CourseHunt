"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { EnrolledCourseResponse } from "@/schema/courses.types";
import { Icon } from "@/components/icon";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";

const columnHelper = createColumnHelper<EnrolledCourseResponse>();

const statusMap: Record<string, StatusBadgeEntry> = {
  completed: { label: "Completed", variant: "success" },
  "in-progress": { label: "In Progress", variant: "outline" },
};

export const columns: ColumnDef<EnrolledCourseResponse, any>[] = [
  columnHelper.accessor("title", {
    header: "Course",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {course.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={course.image_url} alt={course.title} className="size-full object-cover" />
            ) : (
              <Icon name="book" className="size-5 opacity-40" />
            )}
          </div>
          <p className="max-w-70 truncate font-medium">{course.title}</p>
        </div>
      );
    },
  }),
  columnHelper.accessor("completion_percent", {
    header: "Progress",
    cell: ({ getValue }) => {
      const percent = getValue();
      return (
        <div className="flex items-center gap-2">
          <Progress value={percent} className="h-1.5 w-32" />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {Math.round(percent)}%
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("completion_percent", {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() >= 100 ? "completed" : "in-progress"} map={statusMap} />
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const course = row.original;
      const href = course.last_accessed_lesson_id
        ? `/student/study/${course.id}?lessonId=${course.last_accessed_lesson_id}`
        : `/student/study/${course.id}`;
      return (
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link href={href}>Study</Link>
          </Button>
        </div>
      );
    },
  }),
];
