"use client";

import * as React from "react";
import { useInfiniteEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import type { EnrolledCourseResponse } from "@/schema/courses.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { columns } from "./columns";

export default function StudentLearnPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEnrolledCoursesQuery({ limit: 12 });

  const courses: EnrolledCourseResponse[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.total ?? 0;

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
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />
    </div>
  );
}
