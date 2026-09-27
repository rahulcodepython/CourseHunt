"use client";

import type { Lesson } from "@/schema/lessons.types";
import { getLessonColumns } from "@/components/lessons/lesson-columns";

export const getColumns = (
  courseId: string,
  chapterId: string,
  onEdit: (lesson: Lesson) => void,
  onDelete: (lesson: Lesson) => void,
) => getLessonColumns(courseId, chapterId, { role: "tutor", onEdit, onDelete });
