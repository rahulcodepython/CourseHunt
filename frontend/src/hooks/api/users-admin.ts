"use client";

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
	banned: z.boolean(),
	avatar: MediaSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
	purchasedCourses: z.number(),
	completedCourses: z.number(),
});

export type AdminUserType = z.infer<typeof UserResponseSchema>;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all users for admin.
 */
export function useAdminUsersQuery() {
	return useApiQuery(queryKeys.adminUsers(), () =>
		apiRequest(
			{
				url: "/api/v1/users",
				method: "GET",
			},
			z.array(UserResponseSchema),
		),
	);
}

/**
 * Bans a user by ID.
 */
export function useBanUserMutation() {
	const mutation = useApiMutation(
		(id: string) =>
			apiRequest({
				url: `/api/v1/users/${id}/ban`,
				method: "POST",
			}),
		{ invalidateKeys: [queryKeys.adminUsers()] },
	);

	return {
		...mutation,
		banUser: mutation.execute,
	};
}

/**
 * Unbans a user by ID.
 */
export function useUnbanUserMutation() {
	const mutation = useApiMutation(
		(id: string) =>
			apiRequest({
				url: `/api/v1/users/${id}/unban`,
				method: "POST",
			}),
		{ invalidateKeys: [queryKeys.adminUsers()] },
	);

	return {
		...mutation,
		unbanUser: mutation.execute,
	};
}

/**
 * Switches a user's role by ID.
 */
export function useSwitchUserRoleMutation() {
	return useApiMutation(
		({ id, role }: { id: string; role: string }) =>
			apiRequest({
				url: `/api/v1/users/${id}/role`,
				method: "PATCH",
				data: { role },
			}, z.null()),
		{
			invalidateKeys: [queryKeys.adminUsers()],
			successMessage: "User role updated successfully",
		}
	);
}
