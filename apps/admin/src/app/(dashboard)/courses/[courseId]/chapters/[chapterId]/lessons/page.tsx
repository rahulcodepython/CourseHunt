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

export default function ChapterLessonsPage() {
  const params = useParams<{ courseId: string; chapterId: string }>();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const { data: rawLessons, isLoading } = useLessonsQuery(chapterId);
  const lessons = rawLessons?.data ?? [];

  const columns = getColumns(courseId, chapterId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/courses/${courseId}/chapters`}>
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
        emptyText={isLoading ? "Loading lessons..." : "No lessons found for this chapter"}
      />
    </div>
  );
}
