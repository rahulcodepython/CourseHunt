"use client";

import * as React from "react";
import { useChaptersQuery, useDeleteChapterMutation } from "@/query-hooks/chapters.api";
import type { Chapter } from "@/schema/chapters.types";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getChapterColumns } from "@/components/chapters/chapter-columns";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/icon";
import { CourseChapterDialog } from "@/components/courses/manage/course-chapter-dialog";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";

export function CourseChaptersPage({
  courseId,
  role,
}: {
  courseId: string;
  role: "admin" | "tutor";
}) {
  const isTutor = role === "tutor";

  const { data: rawChapters, isLoading } = useChaptersQuery(
    courseId,
    role === "admin" ? "admin" : "tutor",
  );
  const chapters: Chapter[] = rawChapters ?? [];

  const deleteChapterMutation = useDeleteChapterMutation(courseId);
  const {
    dialogOpen: chapterDialogOpen,
    setDialogOpen: setChapterDialogOpen,
    editing: editingChapter,
    openCreate: openCreateChapter,
    openEdit: openEditChapter,
    deleting: deletingChapter,
    setDeleting: setDeletingChapter,
    requestDelete: requestDeleteChapter,
    confirmDelete: confirmDeleteChapter,
  } = useCrudDialogState<Chapter>();

  // Only pass edit/delete handlers for tutor; for admin, leave undefined so no edit/delete buttons appear
  const chapterColumns = React.useMemo(
    () =>
      getChapterColumns(courseId, {
        role,
        onEdit: isTutor ? openEditChapter : undefined,
        onDelete: isTutor ? requestDeleteChapter : undefined,
      }),
    [courseId, role, isTutor, openEditChapter, requestDeleteChapter],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Curriculum</CardTitle>
            <CardDescription>
              {isTutor
                ? "Organize, create and sequence chapters and lessons"
                : "Inspect all chapters and lectures for this course"}
            </CardDescription>
          </div>
          {isTutor && (
            <Button onClick={openCreateChapter}>
              <Icon name="plus" className="mr-1.5 size-4" />
              Create Chapter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={chapterColumns}
            data={chapters}
            searchPlaceholder="Search chapters..."
            emptyIcon="folder"
            emptyText="No chapters created yet for this course"
            isLoading={isLoading}
            loadingText="Loading chapters..."
          />
        </CardContent>
      </Card>

      {isTutor && (
        <>
          <CourseChapterDialog
            open={chapterDialogOpen}
            onOpenChange={setChapterDialogOpen}
            editing={editingChapter}
            courseId={courseId}
          />
          <ConfirmDeleteDialog
            open={!!deletingChapter}
            onOpenChange={(open) => !open && setDeletingChapter(null)}
            onConfirm={() => confirmDeleteChapter(deleteChapterMutation.execute)}
            loading={deleteChapterMutation.isPending}
            title="Delete Chapter"
            description={`Are you sure you want to delete chapter "${deletingChapter?.title}"? All lessons inside this chapter will also be permanently deleted.`}
            confirmText="Delete Chapter"
          />
        </>
      )}
    </div>
  );
}
