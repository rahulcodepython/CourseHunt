"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { LessonLayoutView } from "@/components/lessons/lesson-layout-view";

export default function TutorLessonLayout({
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
      role="tutor"
    >
      {children}
    </LessonLayoutView>
  );
}
