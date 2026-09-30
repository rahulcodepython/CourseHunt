"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export default function TutorLessonIndexPage() {
  const router = useRouter();
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();

  React.useEffect(() => {
    router.replace(
      `/tutor/courses/${params.courseId}/chapters/${params.chapterId}/lessons/${params.lessonId}/discussions`,
    );
  }, [router, params]);

  return null;
}
