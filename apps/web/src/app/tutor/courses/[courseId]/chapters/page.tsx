"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseChaptersPage } from "@/components/courses/pages/course-chapters-page";

export default function TutorCourseChaptersPage() {
  const params = useParams<{ courseId: string }>();
  return <CourseChaptersPage courseId={params.courseId} role="tutor" />;
}
