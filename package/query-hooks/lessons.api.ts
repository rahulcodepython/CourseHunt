"use client";

import { apiRequest } from "@package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useArrayMutation, appendToArray, replaceInArray, removeFromArray } from "@package/react-query/mutation";
import { useAppQuery } from "@package/react-query/query";
import { queryKeys } from "@package/react-query/query-keys";
import { LessonZod, CreateLessonRequestZod, UpdateLessonRequestZod, AggregatedLessonContentResponseZod, AddResourceRequestZod, UpsertVideoContentRequestZod, UpsertDocumentContentRequestZod, LessonCompleteResponseZod, LessonVideoContentZod, LessonDocumentContentZod, LessonResourceZod } from "@package/schema/lessons.types";
import { DeleteResponseZod } from "@package/schema/common.types";

export function useLessonsQuery(chapterId: string) {
	return useAppQuery(queryKeys.lessons(chapterId), () =>
		apiRequest({ url: `/api/v1/lessons?chapter_id=${chapterId}`, method: "GET" }, z.array(LessonZod)),
	);
}

export function useCreateLessonMutation(chapterId: string) {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof CreateLessonRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons?chapter_id=${chapterId}`, method: "POST", data }, LessonZod),
		queryKey: queryKeys.lessons(chapterId),
		updater: (lesson) => appendToArray(lesson),
		showToast: true,
	});
}

export function useDeleteLessonMutation(chapterId: string) {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.lessons(chapterId),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		showToast: true,
	});
}

export function useUpdateLessonMutation(chapterId: string) {
	return useArrayMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateLessonRequestZod> }) =>
			apiRequest({ url: `/api/v1/lessons/${id}`, method: "PATCH", data }, LessonZod),
		queryKey: queryKeys.lessons(chapterId),
		updater: (lesson) => replaceInArray(lesson),
		showToast: true,
	});
}

export function useCompleteLessonMutation(courseId: string) {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}/complete`, method: "POST" }, LessonCompleteResponseZod),
		invalidateKeys: [queryKeys.courseStudy(courseId)],
		showToast: true,
	});
}

export function useLessonContentQuery(id: string) {
	return useAppQuery(queryKeys.lessonContent(id), () =>
		apiRequest({ url: `/api/v1/lessons/${id}/content`, method: "GET" }, AggregatedLessonContentResponseZod),
	);
}

export function useAddVideoMutation(id: string) {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof UpsertVideoContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/video`, method: "POST", data }, LessonVideoContentZod),
		invalidateKeys: [queryKeys.lessonContent(id)],
		showToast: true,
	});
}

export function useAddDocumentMutation(id: string) {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof UpsertDocumentContentRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/document`, method: "POST", data }, LessonDocumentContentZod),
		invalidateKeys: [queryKeys.lessonContent(id)],
		showToast: true,
	});
}

export function useAddResourceMutation(id: string) {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof AddResourceRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources`, method: "POST", data }, LessonResourceZod),
		invalidateKeys: [queryKeys.lessonContent(id)],
		showToast: true,
	});
}

export function useDeleteResourceMutation(id: string) {
	return useSimpleMutation({
		mutationFn: (resourceId: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources/${resourceId}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [queryKeys.lessonContent(id)],
		showToast: true,
	});
}

export function useLessonResourcesQuery(id: string) {
	return useAppQuery(["lessons", id, "resources"], () =>
		apiRequest({ url: `/api/v1/lessons/${id}/resources`, method: "GET" }, z.array(LessonResourceZod)),
	);
}



