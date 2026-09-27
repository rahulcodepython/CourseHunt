"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import {
  useArrayMutation,
  appendToArray,
  replaceInArray,
  removeFromArray,
} from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  ChapterZod,
  CreateChapterRequestZod,
  UpdateChapterRequestZod,
} from "@/schema/chapters.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useChaptersQuery(courseId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_CHAPTERS : API_ENDPOINTS.TUTOR_CHAPTERS;
  return useQuery({ queryKey: queryKeys.chapters(courseId, scope), queryFn: () =>
    request(
      { url: endpoint, method: "GET", params: { course_id: courseId } },
      z.array(ChapterZod),
    ) });
}

export function useCreateChapterMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (data: z.infer<typeof CreateChapterRequestZod>) =>
      request(
        { url: API_ENDPOINTS.TUTOR_CHAPTERS, method: "POST", params: { course_id: courseId }, data },
        ChapterZod,
      ),
    queryKey: queryKeys.chapters(courseId, "tutor"),
    updater: (ch) => appendToArray(ch),
    showToast: true,
  });
}

export function useUpdateChapterMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateChapterRequestZod> }) =>
      request({ url: `${API_ENDPOINTS.TUTOR_CHAPTERS}/${id}`, method: "PATCH", data }, ChapterZod),
    queryKey: queryKeys.chapters(courseId, "tutor"),
    updater: (ch) => replaceInArray(ch),
    showToast: true,
  });
}

export function useDeleteChapterMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.TUTOR_CHAPTERS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.chapters(courseId, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (id) => removeFromArray(id),
    showToast: true,
  });
}
