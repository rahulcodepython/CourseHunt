"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
  useArrayMutation,
  appendToArray,
  replaceInArray,
  removeFromArray,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  LessonZod,
  CreateLessonRequestZod,
  UpdateLessonRequestZod,
  AggregatedLessonContentResponseZod,
  AddResourceRequestZod,
  UpsertVideoContentRequestZod,
  UpsertDocumentContentRequestZod,
  LessonCompleteResponseZod,
  LessonVideoContentZod,
  LessonDocumentContentZod,
  LessonResourceZod,
} from "@/schema/lessons.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useLessonsQuery(chapterId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_LESSONS : API_ENDPOINTS.TUTOR_LESSONS;
  return useAppQuery(queryKeys.lessons(chapterId, scope), () =>
    apiRequest(
      { url: `${endpoint}?chapter_id=${chapterId}`, method: "GET" },
      z.array(LessonZod),
    ),
  );
}

export function useCreateLessonMutation(chapterId: string) {
  return useArrayMutation({
    mutationFn: (data: z.infer<typeof CreateLessonRequestZod>) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_LESSONS}?chapter_id=${chapterId}`, method: "POST", data },
        LessonZod,
      ),
    queryKey: queryKeys.lessons(chapterId, "tutor"),
    updater: (lesson) => appendToArray(lesson),
    showToast: true,
  });
}

export function useDeleteLessonMutation(chapterId: string) {
  return useArrayMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.lessons(chapterId, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (id) => removeFromArray(id),
    showToast: true,
  });
}

export function useUpdateLessonMutation(chapterId: string) {
  return useArrayMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateLessonRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}`, method: "PATCH", data }, LessonZod),
    queryKey: queryKeys.lessons(chapterId, "tutor"),
    updater: (lesson) => replaceInArray(lesson),
    showToast: true,
  });
}

export function useCompleteLessonMutation(courseId: string) {
  return useSimpleMutation({
    mutationFn: (id: string) =>
      apiRequest(
        { url: `${API_ENDPOINTS.STUDENT_LESSONS}/${id}/complete`, method: "POST" },
        LessonCompleteResponseZod,
      ),
    invalidateKeys: [queryKeys.courseStudy(courseId)],
    showToast: true,
  });
}

export function useLessonContentQuery(id: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_LESSONS : API_ENDPOINTS.TUTOR_LESSONS;
  return useAppQuery(
    queryKeys.lessonContent(id, scope),
    () =>
      apiRequest(
        { url: `${endpoint}/${id}/content`, method: "GET" },
        AggregatedLessonContentResponseZod,
      ),
    { enabled: !!id },
  );
}

export function useAddVideoMutation() {
  return useSimpleMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof UpsertVideoContentRequestZod>;
    }) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}/video`, method: "POST", data },
        LessonVideoContentZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.lessonContent(vars.id, "tutor"),
      queryKeys.lessonContent(vars.id, "admin"),
    ],
    showToast: true,
  });
}

export function useAddDocumentMutation() {
  return useSimpleMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof UpsertDocumentContentRequestZod>;
    }) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}/document`, method: "POST", data },
        LessonDocumentContentZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.lessonContent(vars.id, "tutor"),
      queryKeys.lessonContent(vars.id, "admin"),
    ],
    showToast: true,
  });
}

export function useAddResourceMutation(id: string) {
  return useArrayMutation<
    z.infer<typeof LessonResourceZod>,
    z.infer<typeof AddResourceRequestZod>,
    z.infer<typeof LessonResourceZod>
  >({
    mutationFn: (data: z.infer<typeof AddResourceRequestZod>) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}/resources`, method: "POST", data },
        LessonResourceZod,
      ),
    queryKey: queryKeys.lessonResources(id, "tutor"),
    updater: (resource) => (old) =>
      replaceInArray(resource, {
        matches: (r) => r.id.startsWith("temp-"),
        appendIfMissing: true,
      })(old),
    optimistic: (data) => appendToArray({ ...data, id: `temp-${Date.now()}` }),
    invalidateKeys: [queryKeys.lessonResources(id, "tutor"), queryKeys.lessonResources(id, "admin")],
    showToast: true,
  });
}

export function useDeleteResourceMutation(id: string) {
  return useArrayMutation<
    z.infer<typeof DeleteResponseZod>,
    string,
    z.infer<typeof LessonResourceZod>
  >({
    mutationFn: (resourceId: string) =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_LESSONS}/${id}/resources/${resourceId}`, method: "DELETE" },
        DeleteResponseZod,
      ),
    queryKey: queryKeys.lessonResources(id, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (resourceId) => removeFromArray(resourceId),
    invalidateKeys: [queryKeys.lessonResources(id, "tutor"), queryKeys.lessonResources(id, "admin")],
    showToast: true,
  });
}

export function useLessonResourcesQuery(id: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_LESSONS : API_ENDPOINTS.TUTOR_LESSONS;
  return useAppQuery(queryKeys.lessonResources(id, scope), () =>
    apiRequest(
      { url: `${endpoint}/${id}/resources`, method: "GET" },
      z.array(LessonResourceZod),
    ),
  );
}

export function useStudyLessonContentQuery(id: string) {
  return useAppQuery(
    queryKeys.studyLessonContent(id),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.STUDENT_LESSONS}/${id}/content`, method: "GET" },
        AggregatedLessonContentResponseZod,
      ),
    { enabled: !!id },
  );
}

export function useStudyLessonResourcesQuery(id: string) {
  return useAppQuery(
    queryKeys.studyLessonResources(id),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.STUDENT_LESSONS}/${id}/resources`, method: "GET" },
        z.array(LessonResourceZod),
      ),
    { enabled: !!id },
  );
}
