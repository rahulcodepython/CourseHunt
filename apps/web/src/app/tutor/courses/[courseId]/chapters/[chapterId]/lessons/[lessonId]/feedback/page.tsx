"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useInfiniteFeedbacksQuery, useDeleteFeedbackMutation } from "@/query-hooks/feedbacks.api";
import type { Feedback } from "@/schema/feedbacks.types";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { DataTable } from "@/components/table/data-table";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getColumns } from "./columns";

export default function TutorLessonFeedbackPage() {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteFeedbacksQuery("tutor", { limit: 20 });
  const deleteMutation = useDeleteFeedbackMutation("tutor");

  const feedbacks: Feedback[] = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.total;
  const { deleting, setDeleting, requestDelete, confirmDelete } = useCrudDialogState<Feedback>();

  const handleDelete = () => confirmDelete(deleteMutation.execute);

  const columns = getColumns(requestDelete);

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
