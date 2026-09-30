"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
import { z } from "zod";

import { usePaginatedMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { ListEnrollmentResponseZod, type ListEnrollmentResponse } from "@/schema/enrollments.types";
import { PaginatedResponseZod, type PaginatedResponse } from "@/schema/common.types";

export function useEnrollmentsQuery(
  params: { courseId?: string; userId?: string },
  scope: "admin" | "tutor" = "admin",
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_ENROLLMENTS : API_ENDPOINTS.TUTOR_ENROLLMENTS;
  return useQuery({ queryKey: queryKeys.enrollments(params, scope), queryFn: () =>
    request(
      {
        url: endpoint,
        method: "GET",
        params: compactParams({ course_id: params.courseId, user_id: params.userId }),
      },
      PaginatedResponseZod(ListEnrollmentResponseZod),
    ) });
}

export function useInfiniteEnrollmentsQuery(
  params: { courseId?: string; userId?: string; limit?: number },
  scope: "admin" | "tutor" = "admin",
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_ENROLLMENTS : API_ENDPOINTS.TUTOR_ENROLLMENTS;
  return useInfiniteQuery({
    queryKey: [...queryKeys.enrollments(params, scope), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: endpoint,
          method: "GET",
          params: compactParams({
            course_id: params.courseId,
            user_id: params.userId,
            page: pageParam,
            limit: params.limit ?? 10,
          }),
        },
        PaginatedResponseZod(ListEnrollmentResponseZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

const flipEnrollmentRevoked =
  (userId: string, courseId: string, revoked: boolean) =>
  (old: PaginatedResponse<ListEnrollmentResponse>): PaginatedResponse<ListEnrollmentResponse> => ({
    ...old,
    data: old.data.map((e) =>
      e.user.id === userId && e.course.id === courseId ? { ...e, revoked } : e,
    ),
  });

export function useRevokeEnrollmentMutation(params: { courseId?: string; userId?: string }) {
  return usePaginatedMutation<null, { userId: string; courseId: string }, ListEnrollmentResponse>({
    mutationFn: ({ userId, courseId }) =>
      request(
        { url: `${API_ENDPOINTS.ADMIN_ENROLLMENTS}/${userId}/${courseId}/revoke`, method: "POST" },
        z.null(),
      ),
    queryKey: queryKeys.enrollments(params, "admin"),
    updater: () => (old: any) => old,
    optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, true),
    invalidateKeys: [queryKeys.enrollmentsAll()],
    showToast: true,
  });
}

export function useRegainEnrollmentMutation(params: { courseId?: string; userId?: string }) {
  return usePaginatedMutation<null, { userId: string; courseId: string }, ListEnrollmentResponse>({
    mutationFn: ({ userId, courseId }) =>
      request(
        { url: `${API_ENDPOINTS.ADMIN_ENROLLMENTS}/${userId}/${courseId}/regain`, method: "POST" },
        z.null(),
      ),
    queryKey: queryKeys.enrollments(params, "admin"),
    updater: () => (old: any) => old,
    optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, false),
    invalidateKeys: [queryKeys.enrollmentsAll()],
    showToast: true,
  });
}
