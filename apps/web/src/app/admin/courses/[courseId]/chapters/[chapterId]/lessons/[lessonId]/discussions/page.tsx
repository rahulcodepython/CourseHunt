"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { DiscussionsTab } from "@/app/student/study/[courseId]/components/tabs/discussions-tab";

export default function AdminLessonDiscussionsPage() {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const { courseId, chapterId, lessonId } = params;

  const { data: rawCourses } = useManageCourseQuery(courseId);
  const { data: chaptersData } = useChaptersQuery(courseId);
  const { data: lessonsData } = useLessonsQuery(chapterId);

  const currentCourse = rawCourses?.data;
  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);
  const currentLesson = (lessonsData?.data as any[])?.find((l: any) => l.id === lessonId);

  useSetBreadcrumbs([
    { label: "Courses", href: "/admin/courses" },
    { label: currentCourse?.title || "Course", href: `/admin/courses/overview/${courseId}` },
    { label: "Chapters", href: `/admin/courses/${courseId}/chapters` },
    {
      label: currentChapter?.title || "Chapter",
      href: `/admin/courses/${courseId}/chapters/${chapterId}/lessons`,
    },
    { label: currentLesson?.title || "Lesson" },
    { label: "Discussions" },
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Lessons
            </span>
          </Link>
        </Button>
        <PageHeader title="Lesson Discussions" subtitle="Community Q&A and comments thread" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <DiscussionsTab lessonId={lessonId} canEditAny canDeleteAny />
        </CardContent>
      </Card>
    </div>
  );
}
