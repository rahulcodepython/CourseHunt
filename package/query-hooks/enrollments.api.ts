"use client";

import { apiRequest } from "@/package/react-query/client";

import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { ListEnrollmentResponseZod } from "@/package/schema/enrollments.types";
import { PaginatedResponseZod } from "@/package/schema/common.types";

export function useEnrollmentsQuery(courseId: string) {
	return useAppQuery(queryKeys.enrollments(courseId), () =>
		apiRequest({ url: `/api/v1/enrollments/${courseId}`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}

export function useInspectEnrollmentsQuery(courseId: string) {
	return useAppQuery(queryKeys.enrollmentsInspect(courseId), () =>
		apiRequest({ url: `/api/v1/enrollments/${courseId}/inspect`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}
