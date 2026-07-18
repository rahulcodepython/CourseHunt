"use client";

import { apiRequest } from "@/lib/client";

import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { ListEnrollmentResponseZod } from "@/types/enrollments.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useEnrollmentsQuery() {
	return useAppQuery(queryKeys.enrollments(), () =>
		apiRequest({ url: "/api/v1/enrollments", method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}

export function useInspectEnrollmentsQuery(courseId: string) {
	return useAppQuery(queryKeys.enrollmentsInspect(courseId), () =>
		apiRequest({ url: `/api/v1/enrollments/inspect?course_id=${courseId}`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}
