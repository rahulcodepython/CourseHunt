"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { CourseUpdatesManager } from "@/components/updates/course-updates-manager";

export default function TutorCourseUpdatesPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useManageCourseQuery(params.courseId, "tutor");

  return <CourseUpdatesManager courseId={params.courseId} courseTitle={course?.title} />;
}
