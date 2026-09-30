"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseOverviewPage } from "@/components/courses/pages/course-overview-page";

export default function TutorCoursePage() {
  const params = useParams<{ courseId: string }>();
  return <CourseOverviewPage courseId={params.courseId} role="tutor" />;
}
