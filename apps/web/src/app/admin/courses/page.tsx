"use client";
import * as React from "react";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { Course } from "@/schema/courses.types";
import { getColumns } from "./columns";
import { CourseDetailsModal } from "@/components/course-details-modal";

export default function CoursesPage() {
  const { data: rawCourses, isLoading } = useManageCoursesQuery();
  const courses = (rawCourses?.data?.data as any) ?? [];
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
