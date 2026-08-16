"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuizMetadataQuery, useQuizQuestionsQuery, useDeleteQuestionMutation } from "@/query-hooks/quiz.api";
import type { QuizMetadata, QuizQuestionDetail } from "@/schema/quiz.types";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { QuizSettingsForm } from "./quiz-settings-form";
import { QuestionForm } from "./question-form";
import { getColumns } from "./question-columns";

function formatTime(seconds: number): string {
  if (!seconds) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export default function TutorLessonQuizPage() {
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
    { label: currentChapter?.title || "Chapter", href: `/tutor/courses/${courseId}/chapters/${chapterId}/lessons` },
    { label: currentLesson?.title || "Lesson" },
    { label: "Quiz" },
  ]);

  const { data: rawMetadata, isLoading: metadataLoading } = useQuizMetadataQuery(lessonId);
  const metadata: QuizMetadata | null = rawMetadata?.success ? rawMetadata.data ?? null : null;

  const deleteMutation = useDeleteQuestionMutation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<QuizQuestionDetail | null>(null);
  const [deleting, setDeleting] = React.useState<QuizQuestionDetail | null>(null);

  const { data: rawQuestions, isLoading: questionsLoading } = useQuizQuestionsQuery(
    metadata?.id ?? "",
  );
  const questions: QuizQuestionDetail[] = rawQuestions?.success ? (rawQuestions.data ?? []) : [];

  const handleDelete = async () => {
    if (deleting && metadata) {
      await deleteMutation.execute({ quizId: metadata.id, questionId: deleting.id });
      setDeleting(null);
    }
  };

  const columns = getColumns(setEditingQuestion, setDeleting);

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
          title={metadata ? metadata.title : "Configure Quiz"}
          subtitle="Manage the quiz settings and its questions"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <Icon name="settings" className="size-4" />
                Settings
              </Button>
              <Button onClick={() => setAdding(true)} disabled={!metadata}>
                <Icon name="plus" className="size-4" />
                Add Question
              </Button>
            </div>
          }
        />
      </div>

      {metadata && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{metadata.total_questions} total</Badge>
          <Badge variant="outline">{formatTime(metadata.time_limit_seconds)}</Badge>
          <Badge variant="outline">Pass {metadata.pass_score_percent}%</Badge>
        </div>
      )}

      {metadataLoading ? (
        <p className="text-sm text-muted-foreground">Loading quiz...</p>
      ) : metadata ? (
        <DataTable
          columns={columns}
          data={questions}
          searchPlaceholder="Search questions..."
          showColumnToggle={false}
          showPagination={questions.length > 10}
          emptyIcon="list"
          emptyText="No questions yet — add the first one"
          isLoading={questionsLoading}
          loadingText="Loading questions..."
        />
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          Configure the quiz settings before adding questions.
        </p>
      )}

      <FormDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Quiz Settings"
        description={metadata ? "Update the quiz title, time limit and pass score" : "Set up the quiz for this lesson"}
      >
        <QuizSettingsForm lessonId={lessonId} metadata={metadata} onSuccess={() => setSettingsOpen(false)} />
      </FormDialog>

      <FormDialog
        open={adding || !!editingQuestion}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setEditingQuestion(null);
          }
        }}
        title={editingQuestion ? "Edit Question" : "Add Question"}
        description={editingQuestion ? "Update this question" : "Create a new question for this quiz"}
        className="max-h-[90vh] overflow-y-auto"
      >
        {metadata && (
          <QuestionForm
            quizId={metadata.id}
            editingQuestion={editingQuestion}
            onSuccess={() => {
              setAdding(false);
              setEditingQuestion(null);
            }}
          />
        )}
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete Question"
      />
    </div>
  );
}
