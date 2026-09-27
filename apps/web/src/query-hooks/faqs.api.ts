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
import { FaqZod, CreateFaqRequestZod, UpdateFaqRequestZod } from "@/schema/faqs.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useFaqsQuery(courseId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_FAQS : API_ENDPOINTS.TUTOR_FAQS;
  return useQuery({ queryKey: queryKeys.faqs(courseId, scope), queryFn: () => request({ url: endpoint, method: "GET", params: { course_id: courseId } }, z.array(FaqZod)), enabled: !!courseId });
}

export function usePublicFaqsQuery(courseId: string) {
  return useQuery({ queryKey: queryKeys.faqsPublic(courseId), queryFn: () =>
      request(
        { url: API_ENDPOINTS.FAQS_PUBLIC, method: "GET", params: { course_id: courseId } },
        z.array(FaqZod),
      ), enabled: !!courseId });
}

export function useCreateFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (data: z.infer<typeof CreateFaqRequestZod>) =>
      request({ url: API_ENDPOINTS.TUTOR_FAQS, method: "POST", params: { course_id: courseId }, data }, FaqZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (faq) => appendToArray(faq),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}

export function useUpdateFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateFaqRequestZod> }) =>
      request({ url: `${API_ENDPOINTS.TUTOR_FAQS}/${id}`, method: "PATCH", data }, FaqZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (faq) => replaceInArray(faq),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}

export function useDeleteFaqMutation(courseId: string) {
  return useArrayMutation({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.TUTOR_FAQS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.faqs(courseId, "tutor"),
    updater: (res) => removeFromArray(res.id),
    optimistic: (id) => removeFromArray(id),
    invalidateKeys: [queryKeys.faqs(courseId, "tutor"), queryKeys.faqs(courseId, "admin")],
    showToast: true,
  });
}
