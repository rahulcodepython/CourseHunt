"use client";

import type { Chapter } from "@/schema/chapters.types";
import { getChapterColumns } from "@/components/chapters/chapter-columns";

export const getColumns = (
  courseId: string,
  onEdit: (chapter: Chapter) => void,
  onDelete: (chapter: Chapter) => void,
) => getChapterColumns(courseId, { role: "tutor", onEdit, onDelete });
