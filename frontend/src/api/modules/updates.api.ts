"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CourseUpdateZod, CreateUpdateRequestZod, UpdateUpdateRequestZod, UpdateFeedResponseZod } from "@/types/updates.types";


/**
 * Fetches updates.
 */
export function useUpdatesQuery() {
	return useApiQuery(queryKeys.updates(), () =>
		apiRequest({ url: "/api/v1/updates", method: "GET" }, z.array(CourseUpdateZod)),
	);
}

/**
 * Fetches updates feed for user.
 */
export function useUpdateFeedQuery() {
	return useApiQuery(queryKeys.updateFeed(), () =>
		apiRequest({ url: "/api/v1/updates/feed", method: "GET" }, UpdateFeedResponseZod),
	);
}

/**
 * Creates a new update.
 * Cache strategy: prepends to the updates list.
 */
export function useCreateUpdateMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateUpdateRequestZod>) =>
			apiRequest({ url: "/api/v1/updates", method: "POST", data }, CourseUpdateZod),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.prepend(),
			},
			successMessage: "Update created successfully",
		},
	);
}

/**
 * Deletes an update.
 * Cache strategy: removes from the updates list.
 */
export function useDeleteUpdateMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/updates/${id}`, method: "DELETE" }, z.any()),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Update deleted successfully",
		},
	);
}

/**
 * Updates an existing update.
 * Cache strategy: updates the matching item in the list.
 */
export function useUpdateUpdateMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateUpdateRequestZod> }) =>
			apiRequest({ url: `/api/v1/updates/${id}`, method: "PATCH", data }, CourseUpdateZod),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.update((item: any, variables: any) => item.id === variables.id),
			},
			successMessage: "Update modified successfully",
		},
	);
}
