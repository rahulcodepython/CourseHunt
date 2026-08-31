"use client";

import * as React from "react";
import Link from "next/link";

import type { CourseStudyResponse, StudyLessonItem } from "@/schema/courses.types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Icon, type IconName } from "@/components/icon";
import { LESSON_TYPE } from "@/lib/const";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const LESSON_TYPE_ICON: Record<string, IconName> = {
  [LESSON_TYPE.VIDEO]: "video",
  [LESSON_TYPE.DOCUMENT]: "file-text",
  [LESSON_TYPE.QUIZ]: "help-circle",
};

function LessonRow({
  courseId,
  lesson,
  active,
}: {
  courseId: string;
  lesson: StudyLessonItem;
  active: boolean;
}) {
  return (
    <Link
      href={`/student/study/${courseId}?lessonId=${lesson.id}`}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted",
        active && "bg-primary/10 text-primary font-medium",
      )}
    >
      {lesson.completed ? (
        <Icon name="check" className="size-4 shrink-0 text-green-600" />
      ) : (
        <Icon name="circle" className="size-4 shrink-0 text-muted-foreground opacity-40" />
      )}
      <Icon
        name={LESSON_TYPE_ICON[lesson.lesson_type] ?? "file-text"}
        className="size-4 shrink-0 text-muted-foreground"
      />
      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatDuration(lesson.duration_seconds)}
      </span>
    </Link>
  );
}

export function CourseSidebar({
  courseId,
  study,
  activeLessonId,
}: {
  courseId: string;
  study: CourseStudyResponse;
  activeLessonId: string | null;
}) {
  const activeChapterId = React.useMemo(
    () => study.chapters.find((c) => c.lessons.some((l) => l.id === activeLessonId))?.id,
    [study.chapters, activeLessonId],
  );

  const [expanded, setExpanded] = React.useState<string[]>(
    activeChapterId ? [activeChapterId] : [],
  );

  React.useEffect(() => {
    if (activeChapterId) {
      setExpanded((prev) => (prev.includes(activeChapterId) ? prev : [...prev, activeChapterId]));
    }
  }, [activeChapterId]);

  return (
    <aside className="w-full min-w-0 shrink-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-100">
      <div className="flex h-full min-w-0 flex-col rounded-lg border bg-card">
        <div className="min-w-0 border-b p-4">
          <p className="truncate font-semibold">{study.course.title}</p>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={study.completion_percent} className="h-1.5" />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {Math.round(study.completion_percent)}%
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
          <Accordion type="multiple" value={expanded} onValueChange={setExpanded}>
            {study.chapters.map((chapter) => (
              <AccordionItem key={chapter.id} value={chapter.id} className="border-b-0">
                <AccordionTrigger className="min-w-0 px-2.5 py-2.5 hover:no-underline">
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">
                      Ch {chapter.chapter_no}: {chapter.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {chapter.progress.lessons_completed}/{chapter.total_lectures} lectures
                      &middot; {formatDuration(chapter.total_duration_seconds)}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <div className="space-y-0.5">
                    {chapter.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        courseId={courseId}
                        lesson={lesson}
                        active={lesson.id === activeLessonId}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </aside>
  );
}
