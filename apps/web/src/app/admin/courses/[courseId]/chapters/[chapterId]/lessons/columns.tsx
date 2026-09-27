"use client";

import { getLessonColumns } from "@/components/lessons/lesson-columns";

export const getColumns = (courseId: string, chapterId: string) =>
  getLessonColumns(courseId, chapterId, { role: "admin" });
