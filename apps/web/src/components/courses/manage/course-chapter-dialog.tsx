"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useCreateChapterMutation,
  useUpdateChapterMutation,
} from "@/query-hooks/chapters.api";
import type { Chapter } from "@/schema/chapters.types";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { LoadingButton } from "@/components/common/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

const chapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
});
type ChapterFormData = z.infer<typeof chapterSchema>;

export function CourseChapterDialog({
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
      description="Organize your course content into structured chapters"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="chapter-title">Title</Label>
          <Input id="chapter-title" placeholder="e.g. Getting Started" {...register("title")} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
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
