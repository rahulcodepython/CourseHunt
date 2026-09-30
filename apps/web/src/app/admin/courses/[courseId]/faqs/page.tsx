"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CourseFaqsPage } from "@/components/courses/pages/course-faqs-page";

export default function AdminCourseFaqsPage() {
  const params = useParams<{ courseId: string }>();
  return <CourseFaqsPage courseId={params.courseId} role="admin" />;
}
