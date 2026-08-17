"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useLessonContentQuery,
  useAddVideoMutation,
  useAddDocumentMutation,
} from "@/query-hooks/lessons.api";
import { useQuizMetadataQuery, useCreateQuizMutation } from "@/query-hooks/quiz.api";
import type { Lesson } from "@/schema/lessons.types";
import { flushPendingUploads, clearPendingUploads } from "@/lib/pending-uploads";
import { formatDuration } from "@/lib/format";
import { readVideoDuration } from "@/lib/video-duration";
import { cn } from "@/lib/utils";

import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";
import { LoadingButton } from "@/components/loading-button";
import { Icon } from "@/components/icon";
import FileUpload from "@/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// A single form spans both steps — react-hook-form keeps values for
// conditionally-unmounted fields by default, so navigating between steps
// never loses what was already typed. Nothing is sent to the backend until
// the final submit on step 2: metadata, content, and (for quiz lessons)
// quiz settings are all collected locally first, then committed in one
// sequence — no more "lesson gets created the moment step 1 is filled in".
const wizardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  lesson_type: z.string().min(1, "Lesson type is required"),
  short_description: z.string().optional(),
  preview_video_url: z.string().optional(),
  video_url: z.string().optional(),
  written_content: z.string().optional(),
  document_content: z.string().optional(),
  quiz_title: z.string().optional(),
  quiz_time_limit_seconds: z.number().optional(),
  quiz_pass_score_percent: z.number().optional(),
});
type WizardFormData = z.infer<typeof wizardSchema>;

function formatQuizDuration(seconds: number): string {
  if (!seconds) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function LessonWizardDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  editingLesson,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  editingLesson: Lesson | null;
}) {
  const createLessonMutation = useCreateLessonMutation(chapterId);
  const updateLessonMutation = useUpdateLessonMutation(chapterId);
  const addVideoMutation = useAddVideoMutation();
  const addDocumentMutation = useAddDocumentMutation();
  const createQuizMutation = useCreateQuizMutation();

  // Prefill existing content when editing. While creating, `editingLesson` is
  // null, so the empty id disables both queries (`enabled: !!id`) — nothing is
  // fetched until a lesson actually exists.
  const { data: rawContent } = useLessonContentQuery(editingLesson?.id ?? "");
  const content = rawContent?.success ? rawContent.data : null;
  const { data: rawQuizMetadata } = useQuizMetadataQuery(editingLesson?.id ?? "");
  const quizMetadata = rawQuizMetadata?.success ? rawQuizMetadata.data ?? null : null;

  const [step, setStep] = React.useState<1 | 2>(1);
  const [measuredDuration, setMeasuredDuration] = React.useState<number | null>(null);
  const [previewingWritten, setPreviewingWritten] = React.useState(false);
  const [previewingDocument, setPreviewingDocument] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      title: "",
      lesson_type: "video",
      short_description: "",
      preview_video_url: "",
      video_url: "",
      written_content: "",
      document_content: "",
      quiz_title: "",
      quiz_time_limit_seconds: 0,
      quiz_pass_score_percent: 70,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setMeasuredDuration(null);
    reset({
      title: editingLesson?.title ?? "",
      lesson_type: editingLesson?.lesson_type ?? "video",
      short_description: editingLesson?.short_description ?? "",
      preview_video_url: editingLesson?.preview_video_url ?? "",
      video_url: content?.video_content?.video_url ?? "",
      written_content: content?.video_content?.written_content ?? "",
      document_content: content?.document_content?.content ?? "",
      quiz_title: quizMetadata?.title ?? editingLesson?.title ?? "",
      quiz_time_limit_seconds: quizMetadata?.time_limit_seconds ?? 0,
      quiz_pass_score_percent: quizMetadata?.pass_score_percent ?? 70,
    });
    // Only re-run when the dialog opens for a (possibly different) lesson —
    // not on every content/metadata refetch, or edits would keep getting
    // clobbered while the user is mid-way through the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingLesson?.id]);

  const lessonType = watch("lesson_type");
  const isPending =
    createLessonMutation.isPending ||
    updateLessonMutation.isPending ||
    addVideoMutation.isPending ||
    addDocumentMutation.isPending ||
    createQuizMutation.isPending;

  const handleNext = async () => {
    const valid = await trigger(["title", "lesson_type"]);
    if (valid) setStep(2);
  };

  const handleFileSelected = async (file: File) => {
    try {
      setMeasuredDuration(await readVideoDuration(file));
    } catch {
      setMeasuredDuration(null);
    }
  };

  const onSubmit = async (data: WizardFormData) => {
    // 1. Commit the lesson's own metadata first — every other write below
    //    needs its id.
    let lesson: Lesson | null | undefined = editingLesson;
    if (editingLesson) {
      const res = await updateLessonMutation.execute({
        id: editingLesson.id,
        data: {
          title: data.title.trim(),
          short_description: data.short_description?.trim() || null,
          // A plain (possibly empty) string, not null-if-empty — the backend
          // treats "" as "clear this file" and a JSON null as "untouched".
          preview_video_url: (data.preview_video_url ?? "").trim(),
        },
      });
      if (!res?.success || !res.data) return;
      lesson = res.data;
    } else {
      const res = await createLessonMutation.execute({
        title: data.title.trim(),
        lesson_type: data.lesson_type,
        short_description: data.short_description?.trim() || null,
        preview_video_url: data.preview_video_url?.trim() || null,
        duration_seconds: 0,
      });
      if (!res?.success || !res.data) return;
      lesson = res.data;
    }

    // 2. Now that the lesson definitely exists, commit its type-specific
    //    content and flush every file selected anywhere in the wizard
    //    (preview video in step 1, lesson video in step 2, etc.) together.
    const contentCommit =
      data.lesson_type === "video" && data.video_url
        ? addVideoMutation.execute({
            id: lesson.id,
            data: { video_url: data.video_url, written_content: data.written_content?.trim() || null },
          })
        : data.lesson_type === "document" && data.document_content?.trim()
          ? addDocumentMutation.execute({ id: lesson.id, data: { content: data.document_content.trim() } })
          : data.lesson_type === "quiz"
            ? createQuizMutation.execute({
                lessonId: lesson.id,
                data: {
                  title: (data.quiz_title || data.title).trim(),
                  time_limit_seconds: data.quiz_time_limit_seconds || 0,
                  pass_score_percent: data.quiz_pass_score_percent ?? 70,
                },
              })
            : Promise.resolve(null);

    await Promise.all([contentCommit, flushPendingUploads()]);

    if (data.lesson_type === "video" && measuredDuration != null) {
      await updateLessonMutation.execute({ id: lesson.id, data: { duration_seconds: measuredDuration } });
    }

    onOpenChange(false);
  };

  const steps = [
    { n: 1 as const, label: "Details" },
    { n: 2 as const, label: lessonType === "quiz" ? "Quiz Settings" : "Content" },
  ];

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) clearPendingUploads();
        onOpenChange(o);
      }}
      title={editingLesson ? "Edit Lesson" : "Create Lesson"}
      description="Nothing is saved until you finish both steps — resources are managed on their own page"
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
    >
      <div className="mb-4 flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className="h-px flex-1 bg-border" />}
            <button
              type="button"
              onClick={() => setStep(s.n)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                step === s.n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              <span>{s.n}.</span>
              {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">Title</Label>
              <Input id="lesson-title" placeholder="e.g. Introduction to React" {...register("title")} />
              {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                control={control}
                name="lesson_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!editingLesson}>
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
              {editingLesson && (
                <p className="text-xs text-muted-foreground">
                  Type can&apos;t change once a lesson has content — delete and recreate it instead.
                </p>
              )}
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
            <Controller
              control={control}
              name="preview_video_url"
              render={({ field }) => (
                <FileUpload
                  label="Preview Video"
                  field="preview_video_url"
                  accept="video"
                  value={{ url: field.value ?? "", fileType: "video" }}
                  onChange={(_field, url) => field.onChange(url)}
                />
              )}
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && lessonType === "video" && (
          <div className="space-y-4">
            <Controller
              control={control}
              name="video_url"
              render={({ field }) => (
                <FileUpload
                  label="Lesson Video"
                  field="video_url"
                  accept="video"
                  value={{ url: field.value ?? "", fileType: "video" }}
                  onFileSelected={handleFileSelected}
                  onChange={(_field, url) => field.onChange(url)}
                />
              )}
            />
            {(measuredDuration ?? editingLesson?.duration_seconds ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                Duration: {formatDuration(measuredDuration ?? editingLesson?.duration_seconds ?? 0)}
              </p>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="video-written-content">Written Content (optional, Markdown)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setPreviewingWritten((v) => !v)}>
                  <Icon name={previewingWritten ? "pencil" : "eye"} className="size-3.5" />
                  {previewingWritten ? "Write" : "Preview"}
                </Button>
              </div>
              {previewingWritten ? (
                <div className="min-h-32 rounded-md border p-4">
                  {watch("written_content")?.trim() ? (
                    <MarkdownContent content={watch("written_content") ?? ""} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="video-written-content"
                  rows={5}
                  placeholder="Notes, transcript, or supplementary text for this video"
                  {...register("written_content")}
                />
              )}
            </div>
          </div>
        )}

        {step === 2 && lessonType === "document" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="document-content">Content (Markdown)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewingDocument((v) => !v)}>
                <Icon name={previewingDocument ? "pencil" : "eye"} className="size-3.5" />
                {previewingDocument ? "Write" : "Preview"}
              </Button>
            </div>
            {previewingDocument ? (
              <div className="min-h-64 rounded-md border p-4">
                {watch("document_content")?.trim() ? (
                  <MarkdownContent content={watch("document_content") ?? ""} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            ) : (
              <Textarea
                id="document-content"
                rows={12}
                placeholder="Write the lesson content here..."
                {...register("document_content")}
              />
            )}
          </div>
        )}

        {step === 2 && lessonType === "quiz" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="quiz-title">Quiz Title</Label>
              <Input id="quiz-title" placeholder="e.g. Chapter 1 Assessment" {...register("quiz_title")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quiz-time">Time Limit (seconds)</Label>
              <Input
                id="quiz-time"
                type="number"
                min={0}
                placeholder="0 = no limit"
                {...register("quiz_time_limit_seconds", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                {formatQuizDuration(watch("quiz_time_limit_seconds") || 0)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quiz-pass">Pass Score (%)</Label>
              <Input
                id="quiz-pass"
                type="number"
                min={0}
                max={100}
                {...register("quiz_pass_score_percent", { valueAsNumber: true })}
              />
            </div>
            {editingLesson && (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="mb-2 text-sm text-muted-foreground">
                  Questions are managed on their own page, once the quiz is saved.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/tutor/courses/${courseId}/chapters/${chapterId}/lessons/${editingLesson.id}/quiz`}>
                    <Icon name="list" className="size-4" />
                    Manage Questions
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <LoadingButton type="submit" loading={isPending}>
              {editingLesson ? "Save Changes" : "Create Lesson"}
            </LoadingButton>
          </div>
        )}
      </form>
    </FormDialog>
  );
}
