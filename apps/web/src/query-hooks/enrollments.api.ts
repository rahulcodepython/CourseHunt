"use client";

import { apiRequest, compactParams } from "@/react-query/client";
import { z } from "zod";

import { usePaginatedMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { ListEnrollmentResponseZod, type ListEnrollmentResponse } from "@/schema/enrollments.types";
import { PaginatedResponseZod, type PaginatedResponse } from "@/schema/common.types";

export function useEnrollmentsQuery(
  params: { courseId?: string; userId?: string },
  scope: "admin" | "tutor" = "admin",
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_ENROLLMENTS : API_ENDPOINTS.TUTOR_ENROLLMENTS;
  return useAppQuery(queryKeys.enrollments(params, scope), () =>
    apiRequest(
      {
        url: endpoint,
        method: "GET",
        params: compactParams({ course_id: params.courseId, user_id: params.userId }),
      },
      PaginatedResponseZod(ListEnrollmentResponseZod),
    ),
  );
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
      apiRequest(
        { url: `${API_ENDPOINTS.ADMIN_ENROLLMENTS}/${userId}/${courseId}/revoke`, method: "POST" },
        z.null(),
      ),
    queryKey: queryKeys.enrollments(params, "admin"),
    updater: () => (old) => old,
    optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, true),
    invalidateKeys: [queryKeys.enrollmentsAll()],
    showToast: true,
  });
}

export function useRegainEnrollmentMutation(params: { courseId?: string; userId?: string }) {
  return usePaginatedMutation<null, { userId: string; courseId: string }, ListEnrollmentResponse>({
    mutationFn: ({ userId, courseId }) =>
      apiRequest(
        { url: `${API_ENDPOINTS.ADMIN_ENROLLMENTS}/${userId}/${courseId}/regain`, method: "POST" },
        z.null(),
      ),
    queryKey: queryKeys.enrollments(params, "admin"),
    updater: () => (old) => old,
    optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, false),
    invalidateKeys: [queryKeys.enrollmentsAll()],
    showToast: true,
  });
}
