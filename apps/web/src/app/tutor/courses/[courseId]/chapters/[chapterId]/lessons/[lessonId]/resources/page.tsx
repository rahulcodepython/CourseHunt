"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useLessonResourcesQuery,
  useAddResourceMutation,
  useDeleteResourceMutation,
} from "@/query-hooks/lessons.api";
import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import type { LessonResource } from "@/schema/lessons.types";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { LoadingButton } from "@/components/loading-button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import FileUpload from "@/components/file-upload";
import { flushPendingUploads, clearPendingUploads } from "@/lib/pending-uploads";
import { getColumns } from "./columns";

const resourceSchema = z.object({ title: z.string().min(1, "Title is required") });
type ResourceFormData = z.infer<typeof resourceSchema>;

function AddResourceDialog({
  open,
  onOpenChange,
  lessonId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
}) {
  const addResourceMutation = useAddResourceMutation(lessonId);
  const [pendingFile, setPendingFile] = React.useState<{ url: string; fileType: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ title: "" });
      setPendingFile(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: ResourceFormData) => {
    if (!pendingFile?.url) return;
    const [res] = await Promise.all([
      addResourceMutation.execute({
        title: data.title.trim(),
        file_url: pendingFile.url,
        file_type: pendingFile.fileType,
      }),
      flushPendingUploads(),
    ]);
    if (res?.success) onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) clearPendingUploads();
        onOpenChange(o);
      }}
      title="Add Resource"
      description="Attach a downloadable file to this lesson"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-hidden min-w-0 w-full">
        <div className="space-y-1.5">
          <Label htmlFor="resource-title">Resource Title</Label>
          <Input id="resource-title" placeholder="e.g. Slide Deck" {...register("title")} />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <FileUpload
          label="File"
          field="file_url"
          accept="document"
          value={pendingFile ?? { url: "", fileType: "" }}
          onChange={(_field, url, fileType) => setPendingFile({ url, fileType })}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            disabled={!pendingFile?.url}
            loading={addResourceMutation.isPending}
          >
            Add Resource
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function LessonResourcesPage() {
  const params = useParams<{ courseId: string; chapterId: string; lessonId: string }>();
  const { courseId, chapterId, lessonId } = params;

  const { data: rawCourses } = useManageCoursesQuery();
  const { data: chaptersData } = useChaptersQuery(courseId);
  const { data: lessonsData } = useLessonsQuery(chapterId);

  const currentCourse = (rawCourses?.data?.data as any[])?.find((c: any) => c.id === courseId);
  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);
  const currentLesson = (lessonsData?.data as any[])?.find((l: any) => l.id === lessonId);

  useSetBreadcrumbs([
    { label: "My Courses", href: "/tutor/courses" },
    { label: currentCourse?.title || "Course", href: `/tutor/courses/${courseId}` },
    { label: "Chapters", href: `/tutor/courses/${courseId}/chapters` },
    {
      label: currentChapter?.title || "Chapter",
      href: `/tutor/courses/${courseId}/chapters/${chapterId}/lessons`,
    },
    { label: currentLesson?.title || "Lesson" },
    { label: "Resources" },
  ]);

  const { data: rawResources, isLoading } = useLessonResourcesQuery(lessonId);
  const resources: LessonResource[] = rawResources?.success ? (rawResources.data ?? []) : [];
  const deleteResourceMutation = useDeleteResourceMutation(lessonId);

  const [addOpen, setAddOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<LessonResource | null>(null);

  const handleDelete = async () => {
    if (deleting) {
      await deleteResourceMutation.execute(deleting.id);
      setDeleting(null);
    }
  };

  const columns = getColumns(setDeleting);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/tutor/courses/${courseId}/chapters/${chapterId}/lessons`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Lessons
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Lesson Resources"
          subtitle="Downloadable material attached to this lesson"
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <Icon name="plus" className="size-4" />
              Add Resource
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={resources}
        searchPlaceholder="Search resources..."
        emptyIcon="file-text"
        emptyText="No resources added yet"
        isLoading={isLoading}
        loadingText="Loading resources..."
      />

      <AddResourceDialog open={addOpen} onOpenChange={setAddOpen} lessonId={lessonId} />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteResourceMutation.isPending}
        title="Delete Resource"
        description={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        confirmText="Delete Resource"
      />
    </div>
  );
}
