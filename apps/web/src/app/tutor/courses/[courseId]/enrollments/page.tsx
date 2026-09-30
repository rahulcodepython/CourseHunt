"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseEnrollmentsPage } from "@/components/courses/pages/course-enrollments-page";

export default function TutorCourseEnrollmentsPage() {
  const params = useParams<{ courseId: string }>();
  return <CourseEnrollmentsPage courseId={params.courseId} role="tutor" />;
}
