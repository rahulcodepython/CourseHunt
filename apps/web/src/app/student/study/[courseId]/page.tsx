"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { useCourseStudyQuery } from "@/query-hooks/courses.api";
import { useStudyLessonContentQuery, useCompleteLessonMutation } from "@/query-hooks/lessons.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Loading } from "@/components/loading";
import { LESSON_TYPE, ROUTES } from "@/lib/const";
import { LessonVideoPlayer } from "./components/lesson-video-player";
import { MarkdownContent } from "@/components/markdown-content";
import { QuizPlayer } from "./components/quiz/quiz-player";
import { LessonTabs } from "./components/lesson-tabs";

export default function StudyPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lessonId");

  const { data: rawStudy } = useCourseStudyQuery(courseId);
  const study = rawStudy?.data;
  const allLessons = React.useMemo(() => study?.chapters.flatMap((c) => c.lessons) ?? [], [study]);
  const lessonMeta = React.useMemo(
    () => allLessons.find((l) => l.id === lessonId),
    [allLessons, lessonId],
  );
  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  const { data: rawContent, isLoading } = useStudyLessonContentQuery(lessonId ?? "");
  const content = rawContent?.data;
  const completeLesson = useCompleteLessonMutation(courseId);

  if (!lessonId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="book" className="size-10 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            Select a lesson from the sidebar to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !content) return <Loading />;

  return (
    <div key={lessonId} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="truncate">{lessonMeta?.title ?? "Lesson"}</CardTitle>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!previousLesson}
              asChild={!!previousLesson}
            >
              {previousLesson ? (
                <Link href={`/student/study/${courseId}?lessonId=${previousLesson.id}`}>
                  <Icon name="arrow-left" className="size-4" />
                  Previous Lesson
                </Link>
              ) : (
                <span>Previous Lesson</span>
              )}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.STUDENT_DASHBOARD}>
                <Icon name="dashboard" className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={!nextLesson} asChild={!!nextLesson}>
              {nextLesson ? (
                <Link href={`/student/study/${courseId}?lessonId=${nextLesson.id}`}>
                  Next Lesson
                  <Icon name="arrow-right" className="size-4" />
                </Link>
              ) : (
                <span>Next Lesson</span>
              )}
            </Button>
            {content.lesson_type !== LESSON_TYPE.QUIZ && (
              <Button
                size="sm"
                variant={lessonMeta?.completed ? "outline" : "default"}
                disabled={lessonMeta?.completed || completeLesson.isPending}
                onClick={() => completeLesson.execute(lessonId)}
              >
                <Icon name="check" className="size-4" />
                {lessonMeta?.completed ? "Completed" : "Mark Complete"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {content.lesson_type === LESSON_TYPE.VIDEO && content.video_content && (
            <LessonVideoPlayer
              src={content.video_content.video_url}
              title={lessonMeta?.title ?? "Lesson"}
            />
          )}
          {content.lesson_type === LESSON_TYPE.DOCUMENT && content.document_content && (
            <MarkdownContent content={content.document_content.content} />
          )}
          {content.lesson_type === LESSON_TYPE.QUIZ && content.quiz_content && (
            <QuizPlayer quiz={content.quiz_content} courseId={courseId} lessonId={lessonId} />
          )}
        </CardContent>
      </Card>

      <LessonTabs
        courseId={courseId}
        lessonId={lessonId}
        lessonType={content.lesson_type}
        writtenContent={content.video_content?.written_content}
        quizId={content.quiz_content?.id}
      />
    </div>
  );
}
