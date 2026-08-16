"use client";
import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

import { useCourseLandingQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function ChapterLessonsPage() {
  const params = useParams<{ courseId: string; chapterId: string }>();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const { data: courseData } = useCourseLandingQuery(courseId);
  const { data: chaptersData } = useChaptersQuery(courseId);
  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);

  useSetBreadcrumbs([
    { label: "Courses", href: "/courses" },
    { label: courseData?.data?.title || "Course", href: `/courses/overview/${courseId}` },
    { label: "Chapters", href: `/courses/${courseId}/chapters` },
    { label: currentChapter?.title || "Chapter" },
    { label: "Lessons" },
  ]);

  const { data: rawLessons, isLoading } = useLessonsQuery(chapterId);
  const lessons = rawLessons?.data ?? [];

  const columns = getColumns(courseId, chapterId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/admin/courses/${courseId}/chapters`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Chapters
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Chapter Lessons"
          subtitle="Manage lessons for this chapter"
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
    </div>
  );
}
