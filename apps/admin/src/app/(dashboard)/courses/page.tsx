"use client";

import * as React from "react";
import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default function CoursesPage() {
  const { data: rawCourses, isLoading } = useManageCoursesQuery();
  const courses = (rawCourses?.data?.data as any) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle="Search, filter and manage all platform courses"
      />

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses..."
        emptyIcon="book"
        emptyText={isLoading ? "Loading courses..." : "No courses found"}
      />
    </div>
  );
}
