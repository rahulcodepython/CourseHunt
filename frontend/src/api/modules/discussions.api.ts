"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { DiscussionZod, CreateDiscussionRequestZod, UpdateDiscussionRequestZod } from "@/types/discussions.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useDiscussionsQuery(lessonId: string) {
	return useApiQuery(queryKeys.discussions(lessonId), () =>
		apiRequest({ url: `/api/v1/discussions?lessonID=${lessonId}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useCreateDiscussionMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateDiscussionRequestZod>) =>
			apiRequest({ url: "/api/v1/discussions", method: "POST", data }, DiscussionZod),
		{
			invalidatePrefixes: [["discussions"]],
			successMessage: "Discussion created successfully",
		},
	);
}

export function useDiscussionRepliesQuery(id: string) {
	return useApiQuery(queryKeys.discussionReplies(id), () =>
		apiRequest({ url: `/api/v1/discussions/replies/${id}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useDeleteDiscussionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/discussions/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidatePrefixes: [["discussions"]],
			successMessage: "Discussion deleted successfully",
		},
	);
}

export function useUpdateDiscussionMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
			apiRequest({ url: `/api/v1/discussions/${id}`, method: "PATCH", data }, DiscussionZod),
		{
			invalidatePrefixes: [["discussions"]],
			successMessage: "Discussion updated successfully",
		},
	);
}

export function useTutorDeleteDiscussionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/discussions/tutor/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidatePrefixes: [["discussions"]],
			successMessage: "Discussion deleted successfully",
		},
	);
}

export function useAdminDiscussionsQuery() {
	return useApiQuery(queryKeys.discussionsAdmin(), () =>
		apiRequest({ url: "/api/v1/discussions/admin", method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useAdminDeleteDiscussionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/discussions/admin/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidatePrefixes: [["discussions"]],
			successMessage: "Discussion deleted successfully",
		},
	);
}
