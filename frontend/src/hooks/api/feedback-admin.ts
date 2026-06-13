"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiQuery, useApiMutation } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

const FeedbackSchema = z.object({
	id: z.number(),
	_id: z.number(),
	userId: z.string(),
	userName: z.string(),
	userEmail: z.string(),
	rating: z.number(),
	courseId: z.number(),
	courseName: z.string(),
	message: z.string(),
	isPinned: z.boolean(),
	createdAt: z.string(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all feedback for admin.
 */
export function useAdminFeedbackQuery() {
	return useApiQuery(queryKeys.feedbacks(), () =>
		apiRequest(
			{
				url: "/api/v1/feedback",
				method: "GET",
			},
			z.object({ feedbacks: z.array(FeedbackSchema) }),
		),
	);
}

export function usePinFeedbackMutation() {
	return useApiMutation(
		({ id, pinned }: { id: number; pinned: boolean }) =>
			apiRequest({
				url: `/api/v1/feedback/${id}/pin`,
				method: "PATCH",
				data: { pinned },
			}, z.null()),
		{
			invalidateKeys: [queryKeys.feedbacks()],
			successMessage: "Feedback pin status updated",
		}
	);
}

export function useDeleteFeedbackMutation() {
	return useApiMutation(
		(id: number) =>
			apiRequest({
				url: `/api/v1/feedback/${id}`,
				method: "DELETE",
			}, z.null()),
		{
			invalidateKeys: [queryKeys.feedbacks()],
			successMessage: "Feedback deleted successfully",
		}
	);
}
