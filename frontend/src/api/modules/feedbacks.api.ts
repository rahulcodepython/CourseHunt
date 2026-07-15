"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { FeedbackZod, CreateFeedbackRequestZod, PinFeedbackRequestZod } from "@/types/feedbacks.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacks(), () =>
		apiRequest({ url: "/api/v1/feedbacks", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function usePinnedFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacksPinned(), () =>
		apiRequest({ url: "/api/v1/feedbacks/pinned", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function useCreateFeedbackMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateFeedbackRequestZod>) =>
			apiRequest({ url: "/api/v1/feedbacks", method: "POST", data }, FeedbackZod),
		{
			invalidateKeys: [queryKeys.feedbacks(), queryKeys.feedbacksPinned(), queryKeys.feedbacksInspect()],
			successMessage: "Feedback submitted successfully",
		},
	);
}

export function useUpdateFeedbackMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof PinFeedbackRequestZod> }) =>
			apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "PATCH", data }, FeedbackZod),
		{
			invalidateKeys: [queryKeys.feedbacks(), queryKeys.feedbacksPinned(), queryKeys.feedbacksInspect()],
			successMessage: "Feedback updated successfully",
		},
	);
}

export function useDeleteFeedbackMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.feedbacks(), queryKeys.feedbacksPinned(), queryKeys.feedbacksInspect()],
			successMessage: "Feedback deleted successfully",
		},
	);
}

export function useInspectFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacksInspect(), () =>
		apiRequest({ url: "/api/v1/feedbacks/inspect", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}
