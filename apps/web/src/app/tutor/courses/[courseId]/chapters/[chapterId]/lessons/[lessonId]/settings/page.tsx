"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useLessonQuery,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} from "@/query-hooks/lessons.api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/common/icon";
import { Loading } from "@/components/common/loading";
import { LoadingButton } from "@/components/common/loading-button";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";

export default function LessonSettingsPage() {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const { courseId, chapterId, lessonId } = params;
  const router = useRouter();

  const { data: lesson, isLoading } = useLessonQuery(lessonId, "tutor");
  const updateMutation = useUpdateLessonMutation(chapterId);
  const deleteMutation = useDeleteLessonMutation(chapterId);

  const [title, setTitle] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = React.useState("");
  const [durationSeconds, setDurationSeconds] = React.useState<number | "">("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setShortDescription(lesson.short_description || "");
      setPreviewVideoUrl(lesson.preview_video_url || "");
      setDurationSeconds(lesson.duration_seconds ?? "");
    }
  }, [lesson]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updateMutation.execute({
        id: lessonId,
        data: {
          title: title.trim(),
          short_description: shortDescription.trim() || undefined,
          preview_video_url: previewVideoUrl.trim() || undefined,
          duration_seconds: typeof durationSeconds === "number" ? durationSeconds : undefined,
        },
      });
      toast.success("Lesson details updated successfully");
    } catch {
      // handled in mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.execute(lessonId);
      toast.success("Lesson deleted successfully");
      router.push(`/tutor/courses/${courseId}/chapters/${chapterId}`);
    } catch {
      // handled in mutation
    } finally {
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson Settings</CardTitle>
          <CardDescription>Update lesson title, description, and metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4 w-full">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Setting up Fiber router"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lesson-desc">Short Description</Label>
              <Textarea
                id="lesson-desc"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary of this lesson"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lesson-duration">Duration (Seconds)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min={0}
                  value={durationSeconds}
                  onChange={(e) =>
                    setDurationSeconds(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. 600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lesson-preview">Preview Video URL</Label>
                <Input
                  id="lesson-preview"
                  type="url"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <LoadingButton type="submit" loading={updateMutation.isPending}>
                Save Changes
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Icon name="trash" className="size-5" />
            <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
            <Badge variant="destructive" className="ml-auto text-xs font-semibold">
              Irreversible
            </Badge>
          </div>
          <CardDescription className="text-destructive/80 mt-1">
            Permanently delete this lesson and all its associated content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/20 bg-background/50 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Delete this Lesson</h4>
              <p className="text-xs text-muted-foreground max-w-xl">
                Once deleted, this lesson, its videos or documents, resources, discussions, and student
                progress records will be permanently removed.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0"
            >
              <Icon name="trash" className="mr-1.5 size-4" />
              Delete Lesson
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`}
        confirmText="Delete Lesson"
        variant="destructive"
      />
    </div>
  );
}
