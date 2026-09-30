"use client";

import { useParams } from "next/navigation";
import { CourseSettingsPage } from "@/components/courses/pages/course-settings-page";

export default function AdminCourseSettingsRoute() {
  const params = useParams<{ courseId: string }>();
  return <CourseSettingsPage courseId={params.courseId} role="admin" />;
}
