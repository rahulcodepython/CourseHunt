"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CourseUpdateZod, CreateUpdateRequestZod, UpdateUpdateRequestZod, UpdateFeedResponseZod } from "@/types/updates.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useUpdatesQuery() {
	return useApiQuery(queryKeys.updates(), () =>
		apiRequest({ url: "/api/v1/updates", method: "GET" }, PaginatedResponseZod(CourseUpdateZod)),
	);
}

export function useUpdateFeedQuery() {
	return useApiQuery(queryKeys.updateFeed(), () =>
		apiRequest({ url: "/api/v1/updates/feed", method: "GET" }, UpdateFeedResponseZod),
	);
}

export function useCreateUpdateMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateUpdateRequestZod>) =>
			apiRequest({ url: "/api/v1/updates", method: "POST", data }, CourseUpdateZod),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.prepend("data"),
			},
			successMessage: "Update created successfully",
		},
	);
}

export function useDeleteUpdateMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/updates/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Update deleted successfully",
		},
	);
}

export function useUpdateUpdateMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateUpdateRequestZod> }) =>
			apiRequest({ url: `/api/v1/updates/${id}`, method: "PATCH", data }, CourseUpdateZod),
		{
			updateCache: {
				queryKey: queryKeys.updates(),
				updater: cache.update((item: any, variables: any) => item.id === variables.id, "data"),
			},
			successMessage: "Update modified successfully",
		},
	);
}
