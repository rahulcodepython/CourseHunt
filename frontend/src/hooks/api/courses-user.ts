"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

const MediaSchema = z.object({
	url: z.string(),
	fileType: z.string(),
});

const UserCourseSchema = z.object({
	_id: z.number(),
	title: z.string(),
	totalLessons: z.number(),
	completedLessons: z.number(),
	completed: z.boolean(),
	duration: z.string().optional(),
	students: z.number().optional(),
	rating: z.number().optional(),
	reviews: z.number().optional(),
	price: z.number().optional(),
	originalPrice: z.number().optional(),
	category: z.string().optional(),
	discount: z.string().optional(),
	imageUrl: MediaSchema.nullable().optional(),
});
export type UserCourse = z.infer<typeof UserCourseSchema>;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches courses purchased by the current user.
 */
export function useUserCoursesQuery() {
	return useApiQuery(queryKeys.enrolledCourses(), () =>
		apiRequest(
			{
				url: "/api/v1/courses/user",
				method: "GET",
			},
			z.object({ courses: z.array(UserCourseSchema) }),
		),
	);
}
