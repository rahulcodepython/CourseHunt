"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { DiscussionZod, CreateDiscussionRequestZod, UpdateDiscussionRequestZod, DiscussionResponseZod } from "@/types/discussions.types";
import { PaginatedResponseZod } from "@/types/common.types";



/**
 * Fetches discussions for a specific lesson.
 */
export function useDiscussionsQuery(lessonId: string) {
	return useApiQuery(queryKeys.discussions(lessonId), () =>
		apiRequest({ url: `/api/v1/discussions/lesson/${lessonId}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

/**
 * Creates a new discussion for a lesson.
 * Cache strategy: prepends the discussion to the lesson's discussions list.
 */
export function useCreateDiscussionMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateDiscussionRequestZod>) =>
			apiRequest({ url: `/api/v1/discussions/lesson/${lessonId}`, method: "POST", data }, DiscussionZod),
		{
			updateCache: {
				queryKey: queryKeys.discussions(lessonId),
				updater: cache.prepend("data"),
			},
			successMessage: "Discussion created successfully",
		},
	);
}

/**
 * Fetches replies for a specific discussion.
 */
export function useDiscussionRepliesQuery(id: string) {
	return useApiQuery(queryKeys.discussionReplies(id), () =>
		apiRequest({ url: `/api/v1/discussions/replies/${id}`, method: "GET" }, z.array(DiscussionZod)),
	);
}

/**
 * Deletes a discussion.
 * Cache strategy: invalidateKeys since we don't necessarily know which lesson list to update if deleting from a flat list, but if we do, we should use cache.remove. Here we assume we don't have the lessonId in scope for list cache.
 */
export function useDeleteDiscussionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/discussions/${id}`, method: "DELETE" }, z.any()),
		{
			successMessage: "Discussion deleted successfully",
		},
	);
}

/**
 * Updates a discussion.
 * Cache strategy: invalidateKeys.
 */
export function useUpdateDiscussionMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
			apiRequest({ url: `/api/v1/discussions/${id}`, method: "PATCH", data }, DiscussionResponseZod),
		{
			successMessage: "Discussion updated successfully",
		},
	);
}
