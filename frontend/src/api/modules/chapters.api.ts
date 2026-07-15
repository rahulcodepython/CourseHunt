"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { ChapterZod, CreateChapterRequestZod, UpdateChapterRequestZod } from "@/types/chapters.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useChaptersQuery(courseId: string) {
	return useApiQuery(queryKeys.chapters(courseId), () =>
		apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "GET" }, z.array(ChapterZod)),
	);
}

export function useCreateChapterMutation(courseId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateChapterRequestZod>) =>
			apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "POST", data }, ChapterZod),
		{
			updateCache: {
				queryKey: queryKeys.chapters(courseId),
				updater: cache.append(),
			},
			successMessage: "Chapter created successfully",
		},
	);
}

export function useUpdateChapterMutation(courseId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateChapterRequestZod> }) =>
			apiRequest({ url: `/api/v1/chapters/${id}`, method: "PATCH", data }, ChapterZod),
		{
			updateCache: {
				queryKey: queryKeys.chapters(courseId),
				updater: cache.update((item: any, variables: any) => item.id === variables.id),
			},
			successMessage: "Chapter updated successfully",
		},
	);
}

export function useDeleteChapterMutation(courseId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/chapters/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.chapters(courseId),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Chapter deleted successfully",
		},
	);
}
