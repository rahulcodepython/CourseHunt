"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChapterQuery } from "@/query-hooks/chapters.api";
import { useLessonQuery } from "@/query-hooks/lessons.api";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import type { BreadcrumbItemData } from "@/store/breadcrumb.store";
import { formatDuration } from "@/lib/utils/format";
import { LESSON_TYPE_BADGES } from "@/schema/lessons.types";
import { Icon } from "@/components/common/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";

interface LessonLayoutViewProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  role: "admin" | "tutor";
  children: React.ReactNode;
}

export function LessonLayoutView({
  courseId,
  chapterId,
  lessonId,
  role,
  children,
}: LessonLayoutViewProps) {
  const pathname = usePathname();
  const isTutor = role === "tutor";

  const { data: rawCourse } = useManageCourseQuery(courseId, role);
  const { data: chapter, isLoading: isChapterLoading } = useChapterQuery(chapterId, role);
  const { data: lesson, isLoading: isLessonLoading } = useLessonQuery(lessonId, role);

  const basePath = `/${role}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`;

  const courseTitle = rawCourse?.title || "Course";
  const chapterTitle = chapter?.title || "Chapter";
  const lessonTitle = lesson?.title || "Lesson";

  const subTabLabel = pathname.endsWith("/feedback")
    ? "Feedback"
    : pathname.endsWith("/discussions")
    ? "Discussions"
    : pathname.endsWith("/quiz")
    ? "Quiz"
    : pathname.endsWith("/resources")
    ? "Resources"
    : "";

  const breadcrumbs = React.useMemo(() => {
    const list: BreadcrumbItemData[] = [
      { label: isTutor ? "My Courses" : "Courses", href: `/${role}/courses` },
      { label: courseTitle, href: `/${role}/courses/${courseId}` },
      { label: "Chapters", href: `/${role}/courses/${courseId}/chapters` },
      {
        label: chapterTitle,
        href: `/${role}/courses/${courseId}/chapters/${chapterId}/lessons`,
      },
      {
        label: "Lessons",
        href: `/${role}/courses/${courseId}/chapters/${chapterId}/lessons`,
      },
      {
        label: lessonTitle,
        href: `${basePath}/discussions`,
      },
    ];

    if (subTabLabel) {
      list.push({ label: subTabLabel });
    }

    return list;
  }, [
    isTutor,
    role,
    courseTitle,
    courseId,
    chapterTitle,
    chapterId,
    lessonTitle,
    basePath,
    subTabLabel,
  ]);

  useSetBreadcrumbs(breadcrumbs);

  const tabs = [
    { label: "Discussions", href: `${basePath}/discussions`, icon: "messages" },
    { label: "Feedback", href: `${basePath}/feedback`, icon: "star" },
  ];

  if (isTutor) {
    if (lesson?.lesson_type === "quiz") {
      tabs.unshift({ label: "Quiz Settings", href: `${basePath}/quiz`, icon: "list" });
    } else {
      tabs.unshift({ label: "Resources", href: `${basePath}/resources`, icon: "file-text" });
    }
  }

  const isTabActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="w-full space-y-6">
      {/* Short navigation box to visit lessons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="h-8 shadow-sm">
          <Link href={`/${role}/courses/${courseId}/chapters/${chapterId}/lessons`}>
            <Icon name="arrow-left" className="mr-1.5 size-3.5" />
            Back to Lessons
          </Link>
        </Button>
      </div>

      {/* Chapter & Lesson Details Card */}
      <Card className="w-full">
        <CardHeader className="space-y-3 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Chapter {chapter?.chapter_no ?? "—"}: {chapter?.title ?? (isChapterLoading ? "Loading..." : "Chapter")}
            </Badge>
            {lesson && (
              <Badge className={cn("text-xs capitalize", LESSON_TYPE_BADGES[lesson.lesson_type]?.className)}>
                {LESSON_TYPE_BADGES[lesson.lesson_type]?.label ?? lesson.lesson_type}
              </Badge>
            )}
            {lesson?.duration_seconds ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(lesson.duration_seconds)}
              </span>
            ) : null}
          </div>

          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {lesson?.title ?? (isLessonLoading ? "Loading lesson..." : "Lesson Details")}
            </CardTitle>
            <CardDescription className="text-sm mt-1.5 leading-relaxed">
              {lesson?.short_description || "No short description provided for this lesson."}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Sub-Tabs */}
      <div className="w-full">
        <nav
          className="inline-flex w-fit h-auto p-1 bg-muted/60 flex-wrap gap-1 rounded-lg border border-border/40"
          aria-label="Lesson sections"
        >
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                <Icon name={tab.icon as any} className="size-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Full Width Child Page */}
      <div className="w-full">{children}</div>
    </div>
  );
}
