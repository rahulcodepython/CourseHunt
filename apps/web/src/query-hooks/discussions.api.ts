"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  DiscussionZod,
  CreateDiscussionRequestZod,
  UpdateDiscussionRequestZod,
} from "@/schema/discussions.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

function getDiscussionEndpoint(scope: "admin" | "tutor" | "student") {
  switch (scope) {
    case "admin":
      return API_ENDPOINTS.ADMIN_DISCUSSIONS;
    case "tutor":
      return API_ENDPOINTS.TUTOR_DISCUSSIONS;
    case "student":
    default:
      return API_ENDPOINTS.DISCUSSIONS;
  }
}

export function useDiscussionsQuery(
  lessonId: string,
  page: number = 1,
  limit: number = 10,
  scope: "admin" | "tutor" | "student" = "student",
) {
  const endpoint = getDiscussionEndpoint(scope);
  return useAppQuery([...queryKeys.discussions(lessonId, scope), page, limit], () =>
    apiRequest(
      { url: `${endpoint}/lesson/${lessonId}?page=${page}&limit=${limit}`, method: "GET" },
      PaginatedResponseZod(DiscussionZod),
    ),
  );
}

export function useDiscussionRepliesQuery(
  id: string,
  page: number = 1,
  limit: number = 10,
  scope: "admin" | "tutor" | "student" = "student",
) {
  const endpoint = getDiscussionEndpoint(scope);
  return useAppQuery([...queryKeys.discussionReplies(id, scope), page, limit], () =>
    apiRequest(
      { url: `${endpoint}/replies/${id}?page=${page}&limit=${limit}`, method: "GET" },
      PaginatedResponseZod(DiscussionZod),
    ),
  );
}

export function useCreateDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateDiscussionRequestZod>) =>
      apiRequest({ url: endpoint, method: "POST", data }, DiscussionZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}

export function useUpdateDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
      apiRequest({ url: `${endpoint}/${id}`, method: "PATCH", data }, DiscussionZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}

export function useDeleteDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${endpoint}/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}
