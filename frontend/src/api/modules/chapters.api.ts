"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { ChapterZod, CreateChapterRequestZod, UpdateChapterRequestZod } from "@/types/chapters.types";


/**
 * Fetches chapters for a course.
 */
export function useChaptersQuery(courseId: string) {
	return useApiQuery(queryKeys.chapters(courseId), () =>
		apiRequest({ url: `/api/v1/chapters/course/${courseId}`, method: "GET" }, z.array(ChapterZod)),
	);
}

/**
 * Creates a new chapter for a course.
 * Cache strategy: appends directly to the course chapters list.
 */
export function useCreateChapterMutation(courseId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateChapterRequestZod>) =>
			apiRequest({ url: `/api/v1/chapters/course/${courseId}`, method: "POST", data }, ChapterZod),
		{
			updateCache: {
				queryKey: queryKeys.chapters(courseId),
				updater: cache.append(),
			},
			successMessage: "Chapter created successfully",
		},
	);
}

/**
 * Updates an existing chapter.
 * Cache strategy: updates the matching chapter in the list.
 */
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

/**
 * Deletes a chapter.
 * Cache strategy: removes the matching chapter from the list.
 */
export function useDeleteChapterMutation(courseId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/chapters/${id}`, method: "DELETE" }, z.any()),
		{
			updateCache: {
				queryKey: queryKeys.chapters(courseId),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Chapter deleted successfully",
		},
	);
}
