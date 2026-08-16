"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLessonsQuery, useCreateLessonMutation, useUpdateLessonMutation, useDeleteLessonMutation } from "@/query-hooks/lessons.api";
import type { Lesson } from "@/schema/lessons.types";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoadingButton } from "@/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { getColumns } from "./columns";

const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  lesson_no: z.number().min(1, "Lesson number is required"),
  lesson_type: z.string().min(1, "Lesson type is required"),
  short_description: z.string().optional(),
  preview_video_url: z.string().optional(),
  duration_seconds: z.number().min(0),
});

type LessonFormData = z.infer<typeof lessonSchema>;

function LessonDialog({
  open,
  onOpenChange,
  editing,
  chapterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Lesson | null;
  chapterId: string;
}) {
  const createMutation = useCreateLessonMutation(chapterId);
  const updateMutation = useUpdateLessonMutation(chapterId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      lesson_no: 1,
      lesson_type: "video",
      short_description: "",
      preview_video_url: "",
      duration_seconds: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: editing?.title ?? "",
        lesson_no: editing?.lesson_no ?? 1,
        lesson_type: editing?.lesson_type ?? "video",
        short_description: editing?.short_description ?? "",
        preview_video_url: editing?.preview_video_url ?? "",
        duration_seconds: editing?.duration_seconds ?? 0,
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: LessonFormData) => {
    if (editing) {
      await updateMutation.execute({
        id: editing.id,
        data: {
          title: data.title.trim(),
          lesson_no: data.lesson_no,
          short_description: (data.short_description ?? "").trim() || null,
          preview_video_url: (data.preview_video_url ?? "").trim() || null,
          duration_seconds: data.duration_seconds,
        },
      });
    } else {
      await createMutation.execute({
        title: data.title.trim(),
        lesson_no: data.lesson_no,
        lesson_type: data.lesson_type,
        short_description: (data.short_description ?? "").trim() || null,
        preview_video_url: (data.preview_video_url ?? "").trim() || null,
        duration_seconds: data.duration_seconds,
      });
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Lesson" : "Create Lesson"}
      description="Add or update a lesson inside this chapter"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lesson-title">Title</Label>
          <Input id="lesson-title" placeholder="e.g. Introduction to React" {...register("title")} />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-no">Lesson No.</Label>
            <Input
              id="lesson-no"
              type="number"
              min={1}
              {...register("lesson_no", { valueAsNumber: true })}
            />
            {errors.lesson_no && <p className="text-xs text-red-400">{errors.lesson_no.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Controller
              control={control}
              name="lesson_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!editing}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lesson-desc">Short Description</Label>
          <Textarea
            id="lesson-desc"
            {...register("short_description")}
            placeholder="A short summary of this lesson"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-preview">Preview Video URL</Label>
            <Input
              id="lesson-preview"
              {...register("preview_video_url")}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-duration">Duration (seconds)</Label>
            <Input
              id="lesson-duration"
              type="number"
              min={0}
              {...register("duration_seconds", { valueAsNumber: true })}
            />
          </div>
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

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Lesson | null>(null);
  const [deleting, setDeleting] = React.useState<Lesson | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteMutation.execute(deleting.id);
      setDeleting(null);
    }
  };

  const columns = getColumns(courseId, chapterId, openEdit, setDeleting);

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

      <LessonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        chapterId={chapterId}
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