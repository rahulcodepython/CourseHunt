"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { CourseUpdatesManager } from "@/components/updates/course-updates-manager";

export default function AdminCourseUpdatesPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useManageCourseQuery(params.courseId, "admin");

  return (
    <CourseUpdatesManager
      courseId={params.courseId}
      courseTitle={course?.title}
      role="admin"
    />
  );
}
