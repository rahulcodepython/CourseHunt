"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { FeedbackZod, CreateFeedbackRequestZod } from "@/types/feedbacks.types";

import { FeedbackDeleteResponseZod } from "@/types/feedbacks.types";

/**
 * Fetches all feedback.
 */
export function useFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacks(), () =>
		apiRequest({ url: "/api/v1/feedbacks", method: "GET" }, z.array(FeedbackZod)),
	);
}

/**
 * Submits feedback for a course.
 * Cache strategy: prepends new feedback to the list.
 */
export function useCreateFeedbackMutation() {
	return useApiMutation(
		({ courseId, data }: { courseId: string; data: z.infer<typeof CreateFeedbackRequestZod> }) =>
			apiRequest({ url: `/api/v1/feedbacks/course/${courseId}`, method: "POST", data }, FeedbackZod),
		{
			updateCache: {
				queryKey: queryKeys.feedbacks(),
				updater: cache.prepend(),
			},
			successMessage: "Feedback submitted successfully",
		},
	);
}

/**
 * Pins a feedback.
 * Cache strategy: updates the matching feedback in the list.
 */
export function usePinFeedbackMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/feedbacks/${id}/pin`, method: "PATCH" }, FeedbackZod),
		{
			updateCache: {
				queryKey: queryKeys.feedbacks(),
				updater: cache.update((item: any, id: string) => item.id === id),
			},
			successMessage: "Feedback pinned successfully",
		},
	);
}

/**
 * Deletes a feedback item.
 * Cache strategy: removes matching feedback from the list.
 */
export function useDeleteFeedbackMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "DELETE" }, FeedbackDeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.feedbacks(),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Feedback deleted successfully",
		},
	);
}
