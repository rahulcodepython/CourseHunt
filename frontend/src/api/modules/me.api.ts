"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";

// TODO: added MeResponseZod — verify shape against api-docs.md
import { MeResponseZod } from "@/types/users.types";
import { EnrolledCourseResponseZod } from "@/types/courses.types";

/**
 * Fetches the current user's general info.
 */
export function useMeQuery() {
	return useApiQuery(queryKeys.me(), () =>
		apiRequest({ url: "/api/v1/me", method: "GET" }, MeResponseZod),
	);
}

/**
 * Fetches the current user's enrolled courses.
 */
export function useMeEnrolledQuery() {
	return useApiQuery(queryKeys.meEnrolled(), () =>
		apiRequest({ url: "/api/v1/me/enrolled", method: "GET" }, z.array(EnrolledCourseResponseZod)),
	);
}
