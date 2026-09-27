"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
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
  return useQuery({ queryKey: [...queryKeys.discussions(lessonId, scope), page, limit], queryFn: () =>
    request(
      { url: `${endpoint}/lesson/${lessonId}`, method: "GET", params: { page, limit } },
      PaginatedResponseZod(DiscussionZod),
    ) });
}

export function useDiscussionRepliesQuery(
  id: string,
  page: number = 1,
  limit: number = 10,
  scope: "admin" | "tutor" | "student" = "student",
) {
  const endpoint = getDiscussionEndpoint(scope);
  return useQuery({ queryKey: [...queryKeys.discussionReplies(id, scope), page, limit], queryFn: () =>
    request(
      { url: `${endpoint}/replies/${id}`, method: "GET", params: { page, limit } },
      PaginatedResponseZod(DiscussionZod),
    ) });
}

export function useCreateDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateDiscussionRequestZod>) =>
      request({ url: endpoint, method: "POST", data }, DiscussionZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}

export function useUpdateDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
      request({ url: `${endpoint}/${id}`, method: "PATCH", data }, DiscussionZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}

export function useDeleteDiscussionMutation(scope: "admin" | "tutor" | "student" = "student") {
  const endpoint = getDiscussionEndpoint(scope);
  return useSimpleMutation({
    mutationFn: (id: string) =>
      request({ url: `${endpoint}/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.discussionsAll()],
    showToast: true,
  });
}
