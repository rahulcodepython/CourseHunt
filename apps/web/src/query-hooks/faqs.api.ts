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
import { FaqZod, CreateFaqRequestZod, UpdateFaqRequestZod } from "@/schema/faqs.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useFaqsQuery(courseId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_FAQS : API_ENDPOINTS.TUTOR_FAQS;
  return useAppQuery(
    queryKeys.faqs(courseId, scope),
    () => apiRequest({ url: `${endpoint}?course_id=${courseId}`, method: "GET" }, z.array(FaqZod)),
    { enabled: !!courseId },
  );
}

export function usePublicFaqsQuery(courseId: string) {
  return useAppQuery(
    queryKeys.faqsPublic(courseId),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.FAQS_PUBLIC}?course_id=${courseId}`, method: "GET" },
        z.array(FaqZod),
      ),
    { enabled: !!courseId },
  );
}

export function useCreateFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (data: z.infer<typeof CreateFaqRequestZod>) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_FAQS}?course_id=${courseId}`, method: "POST", data }, FaqZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (faq) => appendToArray(faq),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}

export function useUpdateFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateFaqRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_FAQS}/${id}`, method: "PATCH", data }, FaqZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (faq) => replaceInArray(faq),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}

export function useDeleteFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_FAQS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (id) => removeFromArray(id),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}
