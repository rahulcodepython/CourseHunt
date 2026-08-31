"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useFeedbacksQuery,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
} from "@/query-hooks/feedbacks.api";
import type { Feedback } from "@/schema/feedbacks.types";
import { PageHeader } from "@/components/page-header";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function LessonFeedbackPage() {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const { courseId, chapterId, lessonId } = params;

  const { data: courseData } = useManageCourseQuery(courseId);
  const { data: chaptersData } = useChaptersQuery(courseId);
  const { data: lessonsData } = useLessonsQuery(chapterId);

  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);
  const currentLesson = (lessonsData?.data as any[])?.find((l: any) => l.id === lessonId);

  useSetBreadcrumbs([
    { label: "Courses", href: "/admin/courses" },
    { label: courseData?.data?.title || "Course", href: `/admin/courses/overview/${courseId}` },
    { label: "Chapters", href: `/admin/courses/${courseId}/chapters` },
    {
      label: currentChapter?.title || "Chapter",
      href: `/admin/courses/${courseId}/chapters/${chapterId}/lessons`,
    },
    { label: currentLesson?.title || "Lesson" },
    { label: "Feedbacks" },
  ]);

  const { data: rawFeedbacks, isLoading } = useFeedbacksQuery();
  const updateMutation = useUpdateFeedbackMutation();
  const deleteMutation = useDeleteFeedbackMutation();

  const feedbacks: Feedback[] = (rawFeedbacks?.data?.data as any) ?? [];
  const [deleting, setDeleting] = React.useState<Feedback | null>(null);

  const handlePinToggle = async (feedback: Feedback) => {
    await updateMutation.execute({
      id: feedback.id,
      data: { is_pinned: !feedback.is_pinned },
    });
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteMutation.execute(deleting.id);
      setDeleting(null);
    }
  };

  const columns = getColumns(handlePinToggle, setDeleting);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Lessons
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Lesson Feedback"
          subtitle="Review and moderate student feedback for this lesson"
        />
      </div>

      <DataTable
        columns={columns}
        data={feedbacks}
        searchPlaceholder="Search feedback..."
        emptyIcon="star"
        emptyText="No feedback found for this lesson"
        isLoading={isLoading}
        loadingText="Loading feedback..."
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Feedback"
        description={`Are you sure you want to delete the feedback from "${deleting?.user?.name}"? This action cannot be undone.`}
        confirmText="Delete Feedback"
      />
    </div>
  );
}
