"use client";

import * as React from "react";
import { useFaqsQuery, useDeleteFaqMutation } from "@/query-hooks/faqs.api";
import type { Faq } from "@/schema/faqs.types";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getFaqColumns } from "@/components/faqs/faq-columns";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/icon";
import { CourseFaqDialog } from "@/components/courses/manage/course-faq-dialog";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";

export function CourseFaqsPage({
  courseId,
  role,
}: {
  courseId: string;
  role: "admin" | "tutor";
}) {
  const isTutor = role === "tutor";

  const { data: rawFaqs, isLoading } = useFaqsQuery(
    courseId,
    role === "admin" ? "admin" : "tutor",
  );
  const faqs: Faq[] = rawFaqs ?? [];

  const deleteFaqMutation = useDeleteFaqMutation(courseId);
  const {
    dialogOpen: faqDialogOpen,
    setDialogOpen: setFaqDialogOpen,
    editing: editingFaq,
    openCreate: openCreateFaq,
    openEdit: openEditFaq,
    deleting: deletingFaq,
    setDeleting: setDeletingFaq,
    requestDelete: requestDeleteFaq,
    confirmDelete: confirmDeleteFaq,
  } = useCrudDialogState<Faq>();

  const faqColumns = React.useMemo(
    () =>
      getFaqColumns(
        isTutor
          ? { onEdit: openEditFaq, onDelete: requestDeleteFaq }
          : undefined,
      ),
    [isTutor, openEditFaq, requestDeleteFaq],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">
            {isTutor
              ? "Manage questions students frequently ask about this course"
              : "Inspect FAQs listed for this course"}
          </p>
        </div>
        {isTutor && (
          <Button onClick={openCreateFaq}>
            <Icon name="plus" className="mr-1.5 size-4" />
            Create FAQ
          </Button>
        )}
      </div>

      <DataTable
        columns={faqColumns}
        data={faqs}
        searchPlaceholder="Search FAQs..."
        emptyIcon="help-circle"
        emptyText="No FAQs yet for this course"
        isLoading={isLoading}
        loadingText="Loading FAQs..."
      />

      {isTutor && (
        <React.Fragment>
          <CourseFaqDialog
            open={faqDialogOpen}
            onOpenChange={setFaqDialogOpen}
            editing={editingFaq}
            courseId={courseId}
          />
          <ConfirmDeleteDialog
            open={!!deletingFaq}
            onOpenChange={(open) => !open && setDeletingFaq(null)}
            onConfirm={() => confirmDeleteFaq(deleteFaqMutation.execute)}
            loading={deleteFaqMutation.isPending}
            title="Delete FAQ"
            description={`Are you sure you want to delete this FAQ: "${deletingFaq?.question}"? This action cannot be undone.`}
            confirmText="Delete FAQ"
          />
        </React.Fragment>
      )}
    </div>
  );
}
