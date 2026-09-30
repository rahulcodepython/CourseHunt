"use client";

import * as React from "react";

import { useInfiniteManageCoursesQuery } from "@/query-hooks/courses.api";
import type { AdminCourseItem } from "@/schema/courses.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";
import { CourseModal } from "./course-modal";

export default function TutorCoursesPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteManageCoursesQuery({ scope: "tutor", limit: 12 });

  const courses: AdminCourseItem[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.total ?? 0;

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const columns = React.useMemo(() => getColumns(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        subtitle="Create, edit and manage the courses you teach"
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Icon name="plus" className="size-4" />
            Create Course
          </Button>
        }
      />

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

      <CourseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingCourse={null}
      />
    </div>
  );
}
