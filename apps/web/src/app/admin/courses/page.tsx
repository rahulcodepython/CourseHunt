"use client";
import * as React from "react";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import type { Course } from "@/schema/courses.types";
import { getColumns } from "./columns";
import { CourseDetailsModal } from "@/components/dialogs/course-details-modal";

export default function CoursesPage() {
  const { data: rawCourses, isLoading } = useManageCoursesQuery();
  const courses: Course[] = rawCourses?.data?.data ?? [];
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const columns = React.useMemo(() => getColumns({ onViewCourse: setSelectedCourse }), []);

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
      />

      <CourseDetailsModal
        course={selectedCourse}
        open={selectedCourse !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCourse(null);
        }}
      />
    </div>
  );
}
