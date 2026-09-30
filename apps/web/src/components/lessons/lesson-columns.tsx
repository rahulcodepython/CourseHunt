"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { type Lesson, LESSON_TYPE_BADGES } from "@/schema/lessons.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/icon";
import { SortableColumnHeader } from "@/components/table/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/table/row-actions";
import type { TableColumn } from "@/components/table/data-table";
import { cn } from "@/lib/utils/utils";

const columnHelper = createColumnHelper<Lesson>();

export interface LessonColumnOptions {
  role: "admin" | "tutor";
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
}

export const getLessonColumns = (
  courseId: string,
  chapterId: string,
  options: LessonColumnOptions,
): TableColumn<Lesson>[] => {
  const isTutor = options.role === "tutor";
  const cols: TableColumn<Lesson>[] = [
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
        const basePath = `/${options.role}/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`;
        const targetHref = !isTutor
          ? `${basePath}/discussions`
          : lesson.lesson_type === "quiz"
          ? `${basePath}/quiz`
          : `${basePath}/resources`;

        return (
          <div className="flex items-center gap-2">
            <Link
              href={targetHref}
              className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
            >
              {lesson.title}
            </Link>
            <Badge className={cn("shrink-0", LESSON_TYPE_BADGES[lesson.lesson_type]?.className)}>
              {LESSON_TYPE_BADGES[lesson.lesson_type]?.label ?? lesson.lesson_type}
            </Badge>
          </div>
        );
      },
    }),
  ];

  if (isTutor) {
    cols.push(
      columnHelper.display({
        id: "quiz_meta",
        header: "Quiz",
        cell: ({ row }) => {
          const lesson = row.original;
          if (lesson.lesson_type !== "quiz") {
            return <span className="text-muted-foreground">—</span>;
          }
          const basePath = `/${options.role}/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`;
          return (
            <Link
              href={`${basePath}/quiz`}
              className="inline-flex items-center text-xs text-primary hover:underline font-medium"
            >
              Configure Quiz
            </Link>
          );
        },
      }),
    );
  }

  cols.push(
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
        const basePath = `/${options.role}/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`;

        if (!isTutor) {
          return (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={`${basePath}/discussions`}>
                  <Icon name="messages" className="mr-1.5 size-3.5" />
                  Manage
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-8">
                <Link href={`${basePath}/feedback`}>
                  <Icon name="star" className="mr-1.5 size-3.5 text-amber-500 fill-amber-500" />
                  Feedback
                </Link>
              </Button>
            </div>
          );
        }

        const targetHref = lesson.lesson_type === "quiz"
          ? `${basePath}/quiz`
          : `${basePath}/resources`;

        return (
          <RowActions>
            <RowActionButton
              icon="settings"
              label="Manage"
              href={targetHref}
            />
            {options.onEdit && (
              <RowActionButton icon="pencil" label="Edit" onClick={() => options.onEdit?.(lesson)} />
            )}
            {options.onDelete && (
              <RowActionButton
                icon="trash"
                label="Delete"
                onClick={() => options.onDelete?.(lesson)}
                destructive
              />
            )}
          </RowActions>
        );
      },
    }),
  );

  return cols;
};
