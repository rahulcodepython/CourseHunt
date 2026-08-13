"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@/query-hooks/feedbacks.api";
import type { Feedback } from "@/schema/feedbacks.types";
import { PageHeader } from "@/components/page-header";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

export default function LessonFeedbackPage() {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const { courseId, chapterId, lessonId } = params;

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
          <Link href={`/courses/${courseId}/chapters/${chapterId}/lessons`}>
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
        emptyText={isLoading ? "Loading feedback..." : "No feedback found for this lesson"}
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
