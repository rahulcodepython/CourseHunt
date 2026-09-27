"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type Lesson, LESSON_TYPE_BADGES } from "@/schema/lessons.types";
import type { QuizMetadata } from "@/schema/quiz.types";
import { useQuizMetadataQuery } from "@/query-hooks/quiz.api";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/table/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/table/row-actions";
import type { TableColumn } from "@/components/table/data-table";
import { cn } from "@/lib/utils/utils";

const columnHelper = createColumnHelper<Lesson>();

function formatTime(seconds: number): string {
  if (!seconds) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function QuizMetadataCell({ lessonId }: { lessonId: string }) {
  const { data: raw } = useQuizMetadataQuery(lessonId);
  const metadata: QuizMetadata | null = raw ?? null;

  if (!metadata) {
    return <span className="text-xs text-muted-foreground">Not configured</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="font-mono text-xs">
        {metadata.total_questions} questions
      </Badge>
      <span className="text-xs text-muted-foreground">
        {formatTime(metadata.time_limit_seconds)}
      </span>
      <span className="text-xs text-muted-foreground">Pass {metadata.pass_score_percent}%</span>
    </div>
  );
}

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
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{lesson.title}</span>
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
          return <QuizMetadataCell lessonId={lesson.id} />;
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
        return (
          <RowActions>
            {isTutor &&
              (lesson.lesson_type === "quiz" ? (
                <RowActionButton
                  icon="list"
                  label="Manage Quiz"
                  href={`${basePath}/quiz`}
                  iconClassName="text-amber-500"
                />
              ) : (
                <RowActionButton
                  icon="file-text"
                  label="Manage Resources"
                  href={`${basePath}/resources`}
                  iconClassName="text-blue-500"
                />
              ))}
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
            {options.onEdit && (
              <RowActionButton icon="pencil" label="Edit Lesson" onClick={() => options.onEdit?.(lesson)} />
            )}
            {options.onDelete && (
              <RowActionButton
                icon="trash"
                label="Delete Lesson"
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
