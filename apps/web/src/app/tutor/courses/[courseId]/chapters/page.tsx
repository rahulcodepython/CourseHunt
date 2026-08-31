"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
} from "@/query-hooks/chapters.api";
import type { Chapter } from "@/schema/chapters.types";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoadingButton } from "@/components/loading-button";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getColumns } from "./columns";

const chapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

function ChapterDialog({
  open,
  onOpenChange,
  editing,
  courseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Chapter | null;
  courseId: string;
}) {
  const createMutation = useCreateChapterMutation(courseId);
  const updateMutation = useUpdateChapterMutation(courseId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { title: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ title: editing?.title ?? "" });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: ChapterFormData) => {
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
      title={editing ? "Edit Chapter" : "Create Chapter"}
      description="Organize your course content into chapters"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="chapter-title">Title</Label>
          <Input id="chapter-title" placeholder="e.g. Getting Started" {...register("title")} />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save Changes" : "Create"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function TutorCourseChaptersPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: rawCourses } = useManageCoursesQuery();
  const currentCourse = (rawCourses?.data?.data as any[])?.find((c: any) => c.id === courseId);

  useSetBreadcrumbs([
    { label: "My Courses", href: "/tutor/courses" },
    { label: currentCourse?.title || "Course" },
    { label: "Chapters" },
  ]);

  const { data: rawChapters, isLoading } = useChaptersQuery(courseId);
  const deleteMutation = useDeleteChapterMutation(courseId);
  const chapters: Chapter[] = rawChapters?.data ?? [];

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
  } = useCrudDialogState<Chapter>();

  const handleDelete = () => confirmDelete(deleteMutation.execute);

  const columns = getColumns(courseId, openEdit, requestDelete);

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
          title="Course Chapters"
          subtitle="Create, edit and manage the chapters of this course"
          actions={
            <Button onClick={openCreate}>
              <Icon name="plus" className="size-4" />
              Create Chapter
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={chapters}
        searchPlaceholder="Search chapters..."
        emptyIcon="folder"
        emptyText="No chapters found for this course"
        isLoading={isLoading}
        loadingText="Loading chapters..."
      />

      <ChapterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        courseId={courseId}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Chapter"
        description={`Are you sure you want to delete "${deleting?.title}"? All its lessons will also be deleted. This action cannot be undone.`}
        confirmText="Delete Chapter"
      />
    </div>
  );
}
