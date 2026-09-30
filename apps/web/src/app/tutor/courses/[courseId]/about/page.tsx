"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseAboutPage } from "@/components/courses/pages/course-about-page";

export default function TutorCourseAboutPage() {
  const params = useParams<{ courseId: string }>();
  return <CourseAboutPage courseId={params.courseId} role="tutor" />;
}
