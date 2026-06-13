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

const UserResponseSchema = z.object({
	_id: z.string(),
	name: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	phone: z.string(),
	address: z.string(),
	city: z.string(),
	country: z.string(),
	zip: z.string(),
	email: z.string(),
	role: z.string(),
	avatar: MediaSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
	purchasedCourses: z.number(),
	completedCourses: z.number(),
});

const CourseSummarySchema = z.object({
	id: z.number(),
	_id: z.number(),
	creatorId: z.string(),
	title: z.string(),
	description: z.string(),
	duration: z.string(),
	students: z.number(),
	rating: z.number(),
	reviews: z.number(),
	price: z.number(),
	originalPrice: z.number(),
	category: z.string(),
	discount: z.string(),
	totalRevenue: z.number().optional(),
	imageUrl: MediaSchema,
	createdAt: z.string().optional(),
});

const AdminDashboardSchema = z.object({
	students: z.array(UserResponseSchema),
	activeCourses: z.array(CourseSummarySchema),
	totalUsers: z.number(),
	totalCourses: z.number(),
	totalRevenue: z.number(),
	totalEnrollments: z.number(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches dashboard statistics for admin.
 */
export function useAdminDashboardQuery() {
	return useApiQuery(queryKeys.adminDashboard(), () =>
		apiRequest(
			{
				url: "/api/v1/dashboard/admin",
				method: "GET",
			},
			AdminDashboardSchema,
		),
	);
}
