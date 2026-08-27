"use client";

import { useEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import type { EnrolledCourseResponse } from "@/schema/courses.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default function StudentLearnPage() {
  const { data: raw, isLoading } = useEnrolledCoursesQuery();
  const courses: EnrolledCourseResponse[] = raw?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Learn" subtitle="Every course you're enrolled in" />

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search your courses..."
        emptyIcon="book"
        emptyText="You haven't enrolled in any courses yet."
        isLoading={isLoading}
        loadingText="Loading your courses..."
      />
    </div>
  );
}
