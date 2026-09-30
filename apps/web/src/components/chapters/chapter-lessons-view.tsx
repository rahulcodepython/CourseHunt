"use client";

import * as React from "react";
import Link from "next/link";
import { useChapterQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery, useDeleteLessonMutation } from "@/query-hooks/lessons.api";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import type { Lesson } from "@/schema/lessons.types";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { formatDuration } from "@/lib/utils/format";
import { getLessonColumns } from "@/components/lessons/lesson-columns";
import { DataTable } from "@/components/table/data-table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/common/icon";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { LessonWizardDialog } from "@/app/tutor/courses/[courseId]/chapters/[chapterId]/lessons/lesson-wizard-dialog";

interface ChapterLessonsViewProps {
  courseId: string;
  chapterId: string;
  role: "admin" | "tutor";
}

export function ChapterLessonsView({
  courseId,
  chapterId,
  role,
}: ChapterLessonsViewProps) {
  const isTutor = role === "tutor";

  const { data: chapter, isLoading: isChapterLoading } = useChapterQuery(chapterId, role);
  const { data: rawLessons, isLoading: isLessonsLoading } = useLessonsQuery(chapterId, role);
  const lessons = rawLessons ?? [];

  const deleteMutation = useDeleteLessonMutation(chapterId);

  const {
    dialogOpen,
    setDialogOpen,
    editing,
    openCreate,
    openEdit,
    deleting,
    setDeleting,
    requestDelete,
    confirmDelete,
  } = useCrudDialogState<Lesson>();

  const { data: rawCourse } = useManageCourseQuery(courseId, role);
  const courseTitle = rawCourse?.title || "Course";
  const chapterTitle = chapter?.title
    ? chapter.title
    : "Chapter";

  useSetBreadcrumbs([
    { label: isTutor ? "My Courses" : "Courses", href: `/${role}/courses` },
    { label: courseTitle, href: `/${role}/courses/${courseId}` },
    { label: "Chapters", href: `/${role}/courses/${courseId}/chapters` },
    {
      label: chapterTitle,
      href: `/${role}/courses/${courseId}/chapters/${chapterId}/lessons`,
    },
    { label: "Lessons" },
  ]);

  const columns = React.useMemo(
    () =>
      getLessonColumns(courseId, chapterId, {
        role,
        onEdit: isTutor ? openEdit : undefined,
        onDelete: isTutor ? requestDelete : undefined,
      }),
    [courseId, chapterId, role, isTutor, openEdit, requestDelete],
  );

  return (
    <div className="w-full space-y-6">
      {/* Chapter Details Card */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Chapter {chapter?.chapter_no ?? "—"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {chapter?.total_lectures ?? 0} lessons •{" "}
                {formatDuration(chapter?.total_duration_seconds ?? 0)}
              </span>
            </div>
            <CardTitle className="text-xl font-bold">
              {chapter?.title ?? (isChapterLoading ? "Loading chapter..." : "Chapter Details")}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="h-8">
              <Link href={`/${role}/courses/${courseId}/chapters`}>
                <Icon name="arrow-left" className="mr-1.5 size-3.5" />
                All Chapters
              </Link>
            </Button>
            {isTutor && (
              <Button size="sm" className="h-8" onClick={openCreate}>
                <Icon name="plus" className="mr-1.5 size-3.5" />
                Create Lesson
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lessons Table */}
      <DataTable
        columns={columns}
        data={lessons}
        searchPlaceholder="Search lessons..."
        emptyIcon="book"
        emptyText="No lessons found for this chapter"
        isLoading={isLessonsLoading}
        loadingText="Loading lessons..."
      />

      {/* Tutor Lesson Dialogs */}
      {isTutor && (
        <>
          <LessonWizardDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingLesson={editing}
            chapterId={chapterId}
            courseId={courseId}
          />
          <ConfirmDeleteDialog
            open={!!deleting}
            onOpenChange={(open) => !open && setDeleting(null)}
            onConfirm={() => confirmDelete(deleteMutation.execute)}
            loading={deleteMutation.isPending}
            title="Delete Lesson"
            description={`Are you sure you want to delete lesson "${deleting?.title}"? This action cannot be undone.`}
            confirmText="Delete Lesson"
          />
        </>
      )}
    </div>
  );
}
