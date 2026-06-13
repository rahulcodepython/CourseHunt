"use client";

import { UserProfileType } from "@/types/user.type";
import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
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

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches the current user's details.
 */
export function useUserDetailsQuery() {
	return useApiQuery(queryKeys.userDetails(), () =>
		apiRequest(
			{
				url: "/api/v1/users/edit",
				method: "GET",
			},
			UserResponseSchema,
		),
	);
}

/**
 * Updates the current user's profile.
 */
export function useUpdateUserMutation() {
	const mutation = useApiMutation((data: Partial<UserProfileType>) =>
		apiRequest(
			{
				url: "/api/v1/users/edit",
				method: "PATCH",
				data: data,
			},
			z.object({ user: UserResponseSchema }),
		),
	);

	return {
		...mutation,
		updateUser: mutation.execute,
	};
}
