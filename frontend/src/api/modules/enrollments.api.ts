"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { ListEnrollmentResponseZod } from "@/types/enrollments.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useEnrollmentsQuery() {
	return useApiQuery(queryKeys.enrollments(), () =>
		apiRequest({ url: "/api/v1/enrollments", method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}

export function useInspectEnrollmentsQuery(courseId: string) {
	return useApiQuery(queryKeys.enrollmentsInspect(courseId), () =>
		apiRequest({ url: `/api/v1/enrollments/inspect?course_id=${courseId}`, method: "GET" }, PaginatedResponseZod(ListEnrollmentResponseZod)),
	);
}
