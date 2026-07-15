"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { LessonZod, CreateLessonRequestZod, UpdateLessonRequestZod, AggregatedLessonContentResponseZod, SignedURLResponseZod, AddResourceRequestZod, UpsertVideoContentRequestZod, UpsertDocumentContentRequestZod, LessonCompleteResponseZod, LessonVideoContentZod, LessonDocumentContentZod, LessonResourceZod } from "@/types/lessons.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useLessonsQuery(chapterId: string) {
	return useApiQuery(queryKeys.lessons(chapterId), () =>
		apiRequest({ url: `/api/v1/lessons?chapter_id=${chapterId}`, method: "GET" }, z.array(LessonZod)),
	);
}

export function useCreateLessonMutation(chapterId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateLessonRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons?chapter_id=${chapterId}`, method: "POST", data }, LessonZod),
		{
			invalidateKeys: [queryKeys.lessons(chapterId)],
			successMessage: "Lesson created successfully",
		},
	);
}

export function useDeleteLessonMutation(chapterId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/lessons/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.lessons(chapterId)],
			successMessage: "Lesson deleted successfully",
		},
	);
}

export function useUpdateLessonMutation(chapterId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateLessonRequestZod> }) =>
			apiRequest({ url: `/api/v1/lessons/${id}`, method: "PATCH", data }, LessonZod),
		{
			invalidateKeys: [queryKeys.lessons(chapterId)],
			successMessage: "Lesson updated successfully",
		},
	);
}

export function useCompleteLessonMutation(courseId: string) {
	return useApiMutation(
		(id: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}/complete`, method: "POST" }, LessonCompleteResponseZod),
		{
			invalidateKeys: [queryKeys.courseStudy(courseId)],
			successMessage: "Lesson completed",
		},
	);
}

export function useLessonContentQuery(id: string) {
	return useApiQuery(queryKeys.lessonContent(id), () =>
		apiRequest({ url: `/api/v1/lessons/${id}/content`, method: "GET" }, AggregatedLessonContentResponseZod),
	);
}

export function useAddVideoMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertVideoContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/video`, method: "POST", data }, LessonVideoContentZod),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Video added successfully",
		},
	);
}

export function useAddDocumentMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertDocumentContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/document`, method: "POST", data }, LessonDocumentContentZod),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Document added successfully",
		},
	);
}

export function useAddResourceMutation(id: string) {
	return useApiMutation(
		(data: z.infer<typeof AddResourceRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources`, method: "POST", data }, LessonResourceZod),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Resource added successfully",
		},
	);
}

export function useDeleteResourceMutation(id: string) {
	return useApiMutation(
		(resourceId: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources/${resourceId}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.lessonContent(id)],
			successMessage: "Resource deleted successfully",
		},
	);
}

export function useSignedUrlQuery(id: string, fileName: string) {
	return useApiQuery(queryKeys.lessonSignedUrl(id), () =>
		apiRequest({ url: `/api/v1/lessons/${id}/signed-url?file_name=${encodeURIComponent(fileName)}`, method: "GET" }, SignedURLResponseZod),
	);
}
