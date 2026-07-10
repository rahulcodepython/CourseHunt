"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { EnrollmentZod, ManualEnrollRequestZod } from "@/types/enrollments.types";

/**
 * Fetches all enrollments for the user.
 */
export function useEnrollmentsQuery() {
	return useApiQuery(queryKeys.enrollments(), () =>
		apiRequest({ url: "/api/v1/enrollments", method: "GET" }, z.array(EnrollmentZod)),
	);
}

/**
 * Manually enrolls a user into a course.
 * Cache strategy: prepends the new enrollment to the list.
 */
export function useManualEnrollMutation() {
	return useApiMutation(
		({ courseId, data }: { courseId: string; data: z.infer<typeof ManualEnrollRequestZod> }) =>
			apiRequest({ url: `/api/v1/enrollments/manual/course/${courseId}`, method: "POST", data }, EnrollmentZod),
		{
			updateCache: {
				queryKey: queryKeys.enrollments(),
				updater: cache.prepend(),
			},
			successMessage: "Enrolled manually successfully",
		},
	);
}
