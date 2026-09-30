"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  useInfiniteFeedbacksQuery,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
} from "@/query-hooks/feedbacks.api";
import type { Feedback } from "@/schema/feedbacks.types";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { DataTable } from "@/components/table/data-table";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getColumns } from "./columns";

export default function AdminLessonFeedbackPage() {
  const params = useParams<{
    lessonId: string;
  }>();

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteFeedbacksQuery("admin", { limit: 20 });
  const updateMutation = useUpdateFeedbackMutation();
  const deleteMutation = useDeleteFeedbackMutation("admin");

  const feedbacks: Feedback[] = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.total;
  const { deleting, setDeleting, requestDelete, confirmDelete } = useCrudDialogState<Feedback>();

  const handlePinToggle = async (feedback: Feedback) => {
    await updateMutation.execute({
      id: feedback.id,
      data: { is_pinned: !feedback.is_pinned },
    });
  };

  const handleDelete = () => confirmDelete(deleteMutation.execute);

  const columns = getColumns(handlePinToggle, requestDelete);

  return (
    <div className="w-full space-y-6">
      <DataTable
        columns={columns}
        data={feedbacks}
        searchPlaceholder="Search feedback..."
        emptyIcon="star"
        emptyText="No feedback found for this lesson"
        isLoading={isLoading}
        loadingText="Loading feedback..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
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
