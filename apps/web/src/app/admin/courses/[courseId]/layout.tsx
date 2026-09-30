"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseLayoutView } from "@/components/courses/course-layout-view";

export default function AdminCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ courseId: string }>();
  return (
    <CourseLayoutView courseId={params.courseId} role="admin">
      {children}
    </CourseLayoutView>
  );
}
