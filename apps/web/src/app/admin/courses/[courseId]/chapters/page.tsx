"use client";
import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

import { useCourseLandingQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function CourseChaptersPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: courseData } = useCourseLandingQuery(courseId);
  useSetBreadcrumbs([
    { label: "Courses", href: "/courses" },
    { label: courseData?.data?.title || "Course", href: `/courses/overview/${courseId}` },
    { label: "Chapters" },
  ]);

  const { data: rawChapters, isLoading } = useChaptersQuery(courseId);
  const chapters = rawChapters?.data ?? [];
  const columns = getColumns(courseId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/admin/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Course Chapters"
          subtitle="Browse and manage chapters for this course"
        />
      </div>

      <DataTable
        columns={columns}
        data={chapters}
        searchPlaceholder="Search chapters..."
        emptyIcon="folder"
        emptyText="No chapters found for this course"
        isLoading={isLoading}
        loadingText="Loading chapters..."
      />
    </div>
  );
}
