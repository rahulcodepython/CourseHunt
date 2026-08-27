"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { usePaginatedMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { ListEnrollmentResponseZod, type ListEnrollmentResponse } from "@/schema/enrollments.types";
import { PaginatedResponseZod, type PaginatedResponse } from "@/schema/common.types";

export function useEnrollmentsQuery(params: { courseId?: string; userId?: string }) {
	const searchParams = new URLSearchParams();
	if (params.courseId) searchParams.set("course_id", params.courseId);
	if (params.userId) searchParams.set("user_id", params.userId);

	return useAppQuery(queryKeys.enrollments(params), () =>
		apiRequest({ url: `/api/v1/enrollments?${searchParams.toString()}`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}

// Flip the `revoked` flag on the target enrollment (matched by user + course).
// Used for the optimistic update while the revoke/regain request is in flight.
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
			apiRequest({ url: `/api/v1/enrollments/${userId}/${courseId}/revoke`, method: "POST" }, z.null()),
		queryKey: queryKeys.enrollments(params),
		// The revoke endpoint returns no row data, so the optimistic flip is
		// kept as-is on success; the ["enrollments"] invalidation refetches the
		// authoritative list from the server.
		updater: () => (old) => old,
		optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, true),
		invalidateKeys: [["enrollments"]],
		showToast: true,
	});
}

export function useRegainEnrollmentMutation(params: { courseId?: string; userId?: string }) {
	return usePaginatedMutation<null, { userId: string; courseId: string }, ListEnrollmentResponse>({
		mutationFn: ({ userId, courseId }) =>
			apiRequest({ url: `/api/v1/enrollments/${userId}/${courseId}/regain`, method: "POST" }, z.null()),
		queryKey: queryKeys.enrollments(params),
		updater: () => (old) => old,
		optimistic: (vars) => flipEnrollmentRevoked(vars.userId, vars.courseId, false),
		invalidateKeys: [["enrollments"]],
		showToast: true,
	});
}