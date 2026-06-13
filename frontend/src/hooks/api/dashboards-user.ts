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
	duration: z.string().optional(),
	students: z.number().optional(),
	rating: z.number().optional(),
	reviews: z.number().optional(),
	price: z.number().optional(),
	originalPrice: z.number().optional(),
	category: z.string().optional(),
	discount: z.string().optional(),
	imageUrl: MediaSchema.nullable().optional(),
	completed: z.boolean().optional(),
});

export type UserCourseType = z.infer<typeof UserCourseSchema>;

const UserDashboardSchema = z.object({
	user: z.object({
		name: z.string(),
	}),
	courses: z.array(UserCourseSchema),
	enrolledCourses: z.number(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches dashboard statistics for the current user.
 */
export function useUserDashboardQuery() {
	return useApiQuery(queryKeys.userDashboard(), () =>
		apiRequest(
			{
				url: "/api/v1/dashboard/user",
				method: "GET",
			},
			UserDashboardSchema,
		),
	);
}
