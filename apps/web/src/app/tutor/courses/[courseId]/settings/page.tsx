"use client";

import { useParams } from "next/navigation";
import { CourseSettingsPage } from "@/components/courses/pages/course-settings-page";

export default function TutorCourseSettingsRoute() {
  const params = useParams<{ courseId: string }>();
  return <CourseSettingsPage courseId={params.courseId} role="tutor" />;
}
