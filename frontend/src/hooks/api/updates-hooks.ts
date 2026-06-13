"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

export const RecentUpdateSchema = z.object({
	id: z.number(),
	_id: z.number(),
	title: z.string(),
	description: z.string(),
	date: z.string(),
	createdAt: z.string(),
});

export type RecentUpdate = z.infer<typeof RecentUpdateSchema>;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all updates (Admin).
 */
export function useAdminUpdatesQuery() {
	return useApiQuery(queryKeys.updatesAdmin(), () =>
		apiRequest(
			{
				url: "/api/v1/updates/admin",
				method: "GET",
			},
			z.array(RecentUpdateSchema),
		),
	);
}

/**
 * Creates a new update (Admin).
 */
export function useCreateUpdateMutation() {
	return useApiMutation((data: { title: string; description: string; date: string }) =>
		apiRequest(
			{
				url: "/api/v1/updates/admin/create",
				method: "POST",
				data,
			},
			RecentUpdateSchema,
		),
	);
}

/**
 * Updates an existing update (Admin).
 */
export function useUpdateUpdateMutation() {
	return useApiMutation((data: { id: number; title: string; description: string; date: string }) =>
		apiRequest(
			{
				url: `/api/v1/updates/admin/edit/${data.id}`,
				method: "PATCH",
				data,
			},
			RecentUpdateSchema,
		),
	);
}

/**
 * Deletes an update (Admin).
 */
export function useDeleteUpdateMutation() {
	return useApiMutation((id: number) =>
		apiRequest(
			{
				url: `/api/v1/updates/admin/edit/${id}`,
				method: "DELETE",
			},
			z.null(),
		),
	);
}

/**
 * Fetches unseen updates for the current user and marks them as seen.
 */
export function useUnseenUpdatesQuery() {
	return useApiQuery(queryKeys.updatesUnseen(), () =>
		apiRequest(
			{
				url: "/api/v1/updates/unseen",
				method: "GET",
			},
			z.array(RecentUpdateSchema),
		),
	);
}
