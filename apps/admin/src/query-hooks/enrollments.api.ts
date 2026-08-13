"use client";

import { apiRequest } from "@/react-query/client";

import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { ListEnrollmentResponseZod } from "@/schema/enrollments.types";
import { PaginatedResponseZod } from "@/schema/common.types";

export function useEnrollmentsQuery(courseId: string) {
	return useAppQuery(queryKeys.enrollments(courseId), () =>
		apiRequest({ url: `/api/v1/enrollments/${courseId}`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}
