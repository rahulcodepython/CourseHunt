"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ChapterLessonsView } from "@/components/chapters/chapter-lessons-view";

export default function AdminChapterLessonsPage() {
  const params = useParams<{ courseId: string; chapterId: string }>();
  return (
    <ChapterLessonsView
      courseId={params.courseId}
      chapterId={params.chapterId}
      role="admin"
    />
  );
}
