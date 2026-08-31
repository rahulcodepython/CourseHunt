"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
  usePaginatedMutation,
  removeFromPaginated,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  FeedbackZod,
  CreateFeedbackRequestZod,
  PinFeedbackRequestZod,
} from "@/schema/feedbacks.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

function getFeedbackEndpoint(scope: "admin" | "tutor") {
  return scope === "admin" ? API_ENDPOINTS.ADMIN_FEEDBACKS : API_ENDPOINTS.TUTOR_FEEDBACKS;
}

export function useFeedbacksQuery(scope: "admin" | "tutor" = "admin") {
  return useAppQuery(queryKeys.feedbacks(scope), () =>
    apiRequest({ url: getFeedbackEndpoint(scope), method: "GET" }, PaginatedResponseZod(FeedbackZod)),
  );
}

export function usePinnedFeedbacksQuery(courseId?: string) {
  const url = courseId
    ? `${API_ENDPOINTS.FEEDBACKS_PINNED}?course_id=${courseId}`
    : API_ENDPOINTS.FEEDBACKS_PINNED;
  return useAppQuery([...queryKeys.feedbacksPinned(), courseId ?? "all"], () =>
    apiRequest({ url, method: "GET" }, PaginatedResponseZod(FeedbackZod)),
  );
}

export function useCreateFeedbackMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateFeedbackRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.FEEDBACKS, method: "POST", data }, FeedbackZod),
    invalidateKeys: [
      queryKeys.feedbacks("admin"),
      queryKeys.feedbacks("tutor"),
      queryKeys.feedbacksPinned(),
      queryKeys.feedbacksAll(),
    ],
    showToast: true,
  });
}

export function useUpdateFeedbackMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof PinFeedbackRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.ADMIN_FEEDBACKS}/${id}`, method: "PATCH", data }, FeedbackZod),
    invalidateKeys: [
      queryKeys.feedbacks("admin"),
      queryKeys.feedbacks("tutor"),
      queryKeys.feedbacksPinned(),
      queryKeys.feedbacksAll(),
    ],
    showToast: true,
  });
}

export function useDeleteFeedbackMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${getFeedbackEndpoint(scope)}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.feedbacks(scope),
    invalidateKeys: [queryKeys.feedbacksPinned(), queryKeys.feedbacksAll()],
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}
