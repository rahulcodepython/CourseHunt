"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useArrayMutation,
  appendToArray,
  replaceInArray,
  removeFromArray,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  ChapterZod,
  CreateChapterRequestZod,
  UpdateChapterRequestZod,
} from "@/schema/chapters.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useChaptersQuery(courseId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_CHAPTERS : API_ENDPOINTS.TUTOR_CHAPTERS;
  return useAppQuery(queryKeys.chapters(courseId, scope), () =>
    apiRequest(
      { url: `${endpoint}?course_id=${courseId}`, method: "GET" },
      z.array(ChapterZod),
    ),
  );
}

export function useCreateChapterMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (data: z.infer<typeof CreateChapterRequestZod>) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_CHAPTERS}?course_id=${courseId}`, method: "POST", data },
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
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_CHAPTERS}/${id}`, method: "PATCH", data }, ChapterZod),
    queryKey: queryKeys.chapters(courseId, "tutor"),
    updater: (ch) => replaceInArray(ch),
    showToast: true,
  });
}

export function useDeleteChapterMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_CHAPTERS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.chapters(courseId, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (id) => removeFromArray(id),
    showToast: true,
  });
}
