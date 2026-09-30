"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { LessonLayoutView } from "@/components/lessons/lesson-layout-view";

export default function AdminLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();

  return (
    <LessonLayoutView
      courseId={params.courseId}
      chapterId={params.chapterId}
      lessonId={params.lessonId}
      role="admin"
    >
      {children}
    </LessonLayoutView>
  );
}
