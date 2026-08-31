"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLessonsQuery, useDeleteLessonMutation } from "@/query-hooks/lessons.api";
import type { Lesson } from "@/schema/lessons.types";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getColumns } from "./columns";
import { LessonWizardDialog } from "./lesson-wizard-dialog";

export default function TutorChapterLessonsPage() {
  const params = useParams<{ courseId: string; chapterId: string }>();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const { data: rawCourses } = useManageCoursesQuery();
  const { data: chaptersData } = useChaptersQuery(courseId);
  const currentCourse = (rawCourses?.data?.data as any[])?.find((c: any) => c.id === courseId);
  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);

  useSetBreadcrumbs([
    { label: "My Courses", href: "/tutor/courses" },
    { label: currentCourse?.title || "Course", href: `/tutor/courses/${courseId}` },
    { label: "Chapters", href: `/tutor/courses/${courseId}/chapters` },
    { label: currentChapter?.title || "Chapter" },
    { label: "Lessons" },
  ]);

  const { data: rawLessons, isLoading } = useLessonsQuery(chapterId);
  const deleteMutation = useDeleteLessonMutation(chapterId);
  const lessons: Lesson[] = rawLessons?.data ?? [];

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

  const handleDelete = () => confirmDelete(deleteMutation.execute);

  const columns = getColumns(courseId, chapterId, openEdit, requestDelete);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/tutor/courses/${courseId}/chapters`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Chapters
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Chapter Lessons"
          subtitle="Create, edit and manage the lessons of this chapter"
          actions={
            <Button onClick={openCreate}>
              <Icon name="plus" className="size-4" />
              Create Lesson
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={lessons}
        searchPlaceholder="Search lessons..."
        emptyIcon="book"
        emptyText="No lessons found for this chapter"
        isLoading={isLoading}
        loadingText="Loading lessons..."
      />

      <LessonWizardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        chapterId={chapterId}
        editingLesson={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        confirmText="Delete Lesson"
      />
    </div>
  );
}
