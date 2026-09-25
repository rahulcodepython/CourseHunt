"use client";

import { getChapterColumns } from "@/components/chapters/chapter-columns";

export const getColumns = (courseId: string) =>
  getChapterColumns(courseId, { role: "admin" });
