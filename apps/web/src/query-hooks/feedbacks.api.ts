"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
  usePaginatedMutation,
  removeFromPaginated,
} from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
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
  return useQuery({ queryKey: queryKeys.feedbacks(scope), queryFn: () =>
    request({ url: getFeedbackEndpoint(scope), method: "GET" }, PaginatedResponseZod(FeedbackZod)) });
}

export function useInfiniteFeedbacksQuery(
  scope: "admin" | "tutor" = "admin",
  params?: { limit?: number },
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.feedbacks(scope), "infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: getFeedbackEndpoint(scope),
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 10,
          }),
        },
        PaginatedResponseZod(FeedbackZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function usePinnedFeedbacksQuery(courseId?: string) {
  const url = courseId
    ? `${API_ENDPOINTS.FEEDBACKS_PINNED}?course_id=${courseId}`
    : API_ENDPOINTS.FEEDBACKS_PINNED;
  return useQuery({ queryKey: [...queryKeys.feedbacksPinned(), courseId ?? "all"], queryFn: () =>
    request({ url, method: "GET" }, PaginatedResponseZod(FeedbackZod)) });
}

export function useCreateFeedbackMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateFeedbackRequestZod>) =>
      request({ url: API_ENDPOINTS.FEEDBACKS, method: "POST", data }, FeedbackZod),
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
      request({ url: `${API_ENDPOINTS.ADMIN_FEEDBACKS}/${id}`, method: "PATCH", data }, FeedbackZod),
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
      request({ url: `${getFeedbackEndpoint(scope)}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.feedbacks(scope),
    invalidateKeys: [queryKeys.feedbacksPinned(), queryKeys.feedbacksAll()],
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}
