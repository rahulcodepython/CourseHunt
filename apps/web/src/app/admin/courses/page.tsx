"use client";

import * as React from "react";
import { useInfiniteAdminCoursesQuery } from "@/query-hooks/courses.api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { getColumns } from "./columns";

export default function CoursesPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAdminCoursesQuery({ limit: 12 });

  const courses = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.total ?? 0;
  const columns = React.useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" subtitle="Search, filter and manage all platform courses" />

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses..."
        emptyIcon="book"
        emptyText="No courses found"
        isLoading={isLoading}
        loadingText="Loading courses..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />
    </div>
  );
}
