"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { LessonZod, CreateLessonRequestZod, UpdateLessonRequestZod, LessonContentResponseZod, SignedURLResponseZod, LessonCompleteResponseZod, AddResourceRequestZod, UpsertVideoContentRequestZod, UpsertDocumentContentRequestZod } from "@/types/lessons.types";



/**
 * Fetches lessons for a chapter.
 */
export function useLessonsQuery(chapterId: string) {
	return useApiQuery(queryKeys.lessons(chapterId), () =>
		apiRequest({ url: `/api/v1/lessons/chapter/${chapterId}`, method: "GET" }, z.array(LessonZod)),
	);
}

/**
 * Creates a new lesson for a chapter.
 * Cache strategy: appends to the chapter's lesson list.
 */
export function useCreateLessonMutation(chapterId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateLessonRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/chapter/${chapterId}`, method: "POST", data }, LessonZod),
		{
			updateCache: {
				queryKey: queryKeys.lessons(chapterId),
				updater: cache.append(),
			},
			successMessage: "Lesson created successfully",
		},
	);
}

/**
 * Deletes a lesson resource.
 */
export function useDeleteResourceMutation() {
	return useApiMutation(
		(resourceId: string) => apiRequest({ url: `/api/v1/lessons/resources/${resourceId}`, method: "DELETE" }, z.any()),
		{
			successMessage: "Resource deleted successfully",
		},
	);
}

/**
 * Deletes a lesson.
 * Cache strategy: removes the matching lesson from the chapter's lesson list cache.
 */
export function useDeleteLessonMutation(chapterId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/lessons/${id}`, method: "DELETE" }, z.any()),
		{
			updateCache: {
				queryKey: queryKeys.lessons(chapterId),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Lesson deleted successfully",
		},
	);
}

/**
 * Updates a lesson.
 * Cache strategy: updates the matching lesson in the chapter's lesson list cache.
 */
export function useUpdateLessonMutation(chapterId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateLessonRequestZod> }) =>
			apiRequest({ url: `/api/v1/lessons/${id}`, method: "PATCH", data }, LessonZod),
		{
			updateCache: {
				queryKey: queryKeys.lessons(chapterId),
				updater: cache.update((item: any, variables: any) => item.id === variables.id),
			},
			successMessage: "Lesson updated successfully",
		},
	);
}

/**
 * Completes a lesson.
 */
export function useCompleteLessonMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/lessons/${id}/complete`, method: "POST" }, LessonCompleteResponseZod),
		{
			successMessage: "Lesson completed",
		},
	);
}

/**
 * Fetches lesson content.
 */
export function useLessonContentQuery(id: string) {
	return useApiQuery(queryKeys.lessonContent(id), () =>
		apiRequest({ url: `/api/v1/lessons/${id}/content`, method: "GET" }, LessonContentResponseZod(z.any())),
	);
}

/**
 * Adds a document to a lesson.
 * Cache strategy: invalidates lesson content query.
 */
export function useAddDocumentMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertDocumentContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/document`, method: "POST", data }, z.any()),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Document added successfully",
		},
	);
}

/**
 * Adds a resource to a lesson.
 * Cache strategy: invalidates lesson content query.
 */
export function useAddResourceMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof AddResourceRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources`, method: "POST", data }, z.any()),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Resource added successfully",
		},
	);
}

/**
 * Fetches signed URL for lesson.
 */
export function useSignedUrlQuery(id: string) {
	return useApiQuery(queryKeys.lessonSignedUrl(id), () =>
		apiRequest({ url: `/api/v1/lessons/${id}/signed-url`, method: "GET" }, SignedURLResponseZod),
	);
}

/**
 * Adds a video to a lesson.
 * Cache strategy: invalidates lesson content query.
 */
export function useAddVideoMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertVideoContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/video`, method: "POST", data }, z.any()),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Video added successfully",
		},
	);
}
