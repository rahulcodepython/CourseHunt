"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useFaqsQuery, useCreateFaqMutation, useUpdateFaqMutation, useDeleteFaqMutation } from "@/query-hooks/faqs.api";
import type { Faq } from "@/schema/faqs.types";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoadingButton } from "@/components/loading-button";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { getColumns } from "./columns";

const faqSchema = z.object({
  question: z.string().min(3, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

type FaqFormData = z.infer<typeof faqSchema>;

function FaqDialog({
  open,
  onOpenChange,
  editing,
  courseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Faq | null;
  courseId: string;
}) {
  const createMutation = useCreateFaqMutation(courseId);
  const updateMutation = useUpdateFaqMutation(courseId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: "", answer: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ question: editing?.question ?? "", answer: editing?.answer ?? "" });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: FaqFormData) => {
    if (editing) {
      await updateMutation.execute({ id: editing.id, data });
    } else {
      await createMutation.execute(data);
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit FAQ" : "Create FAQ"}
      description="Answer a question students commonly ask about this course"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="faq-question">Question</Label>
          <Input id="faq-question" placeholder="e.g. Do I get a certificate?" {...register("question")} />
          {errors.question && <p className="text-xs text-red-400">{errors.question.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="faq-answer">Answer</Label>
          <Textarea id="faq-answer" rows={4} placeholder="Write the answer here..." {...register("answer")} />
          {errors.answer && <p className="text-xs text-red-400">{errors.answer.message}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {editing ? "Save Changes" : "Create"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function TutorCourseFaqsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: rawCourses } = useManageCoursesQuery();
  const currentCourse = (rawCourses?.data?.data as any[])?.find((c: any) => c.id === courseId);

  useSetBreadcrumbs([
    { label: "My Courses", href: "/tutor/courses" },
    { label: currentCourse?.title || "Course" },
    { label: "FAQs" },
  ]);

  const { data: rawFaqs, isLoading } = useFaqsQuery(courseId);
  const deleteMutation = useDeleteFaqMutation(courseId);
  const faqs: Faq[] = rawFaqs?.data ?? [];

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Faq | null>(null);
  const [deleting, setDeleting] = React.useState<Faq | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteMutation.execute(deleting.id);
      setDeleting(null);
    }
  };

  const columns = getColumns(openEdit, setDeleting);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/tutor/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Course FAQs"
          subtitle="Answer questions students commonly ask about this course"
          actions={
            <Button onClick={openCreate}>
              <Icon name="plus" className="size-4" />
              Create FAQ
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={faqs}
        searchPlaceholder="Search FAQs..."
        emptyIcon="help-circle"
        emptyText="No FAQs yet for this course"
        isLoading={isLoading}
        loadingText="Loading FAQs..."
      />

      <FaqDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} courseId={courseId} />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete FAQ"
        description={`Are you sure you want to delete "${deleting?.question}"? This action cannot be undone.`}
        confirmText="Delete FAQ"
      />
    </div>
  );
}
