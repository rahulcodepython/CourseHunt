"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useArrayMutation, appendToArray, replaceInArray, removeFromArray } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { LessonZod, CreateLessonRequestZod, UpdateLessonRequestZod, AggregatedLessonContentResponseZod, AddResourceRequestZod, UpsertVideoContentRequestZod, UpsertDocumentContentRequestZod, LessonCompleteResponseZod, LessonVideoContentZod, LessonDocumentContentZod, LessonResourceZod } from "@/schema/lessons.types";
import { DeleteResponseZod } from "@/schema/common.types";

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

// Ownership-gated (not enrollment-gated) — for the tutor authoring flow,
// which is the only caller of this hook. A tutor is never "enrolled" in
// their own course, so the student-facing /content endpoint always 403s them.
export function useLessonContentQuery(id: string) {
	return useAppQuery(
		queryKeys.lessonContent(id),
		() => apiRequest({ url: `/api/v1/lessons/${id}/manage/content`, method: "GET" }, AggregatedLessonContentResponseZod),
		{ enabled: !!id },
	);
}

// id is a runtime arg (not a hook param) so this can be called with a
// lesson id that only becomes known partway through a single submit —
// e.g. the lesson wizard's deferred create-then-attach-content flow.
export function useAddVideoMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpsertVideoContentRequestZod> }) =>
			apiRequest({ url: `/api/v1/lessons/${id}/video`, method: "POST", data }, LessonVideoContentZod),
		invalidateKeys: (_data, vars) => [queryKeys.lessonContent(vars.id)],
		showToast: true,
	});
}

export function useAddDocumentMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpsertDocumentContentRequestZod> }) =>
			apiRequest({ url: `/api/v1/lessons/${id}/document`, method: "POST", data }, LessonDocumentContentZod),
		invalidateKeys: (_data, vars) => [queryKeys.lessonContent(vars.id)],
		showToast: true,
	});
}

export function useAddResourceMutation(id: string) {
	return useArrayMutation<
		z.infer<typeof LessonResourceZod>,
		z.infer<typeof AddResourceRequestZod>,
		z.infer<typeof LessonResourceZod>
	>({
		mutationFn: (data: z.infer<typeof AddResourceRequestZod>) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources`, method: "POST", data }, LessonResourceZod),
		queryKey: ["lessons", id, "resources"],
		updater: (resource) => (old) => {
			const tempIndex = old.findIndex((r) => r.id.startsWith("temp-"));
			if (tempIndex === -1) return [...old, resource];
			const next = [...old];
			next[tempIndex] = resource;
			return next;
		},
		optimistic: (data) => appendToArray({ ...data, id: `temp-${Date.now()}` }),
		showToast: true,
	});
}

export function useDeleteResourceMutation(id: string) {
	return useArrayMutation<
		z.infer<typeof DeleteResponseZod>,
		string,
		z.infer<typeof LessonResourceZod>
	>({
		mutationFn: (resourceId: string) =>
			apiRequest({ url: `/api/v1/lessons/${id}/resources/${resourceId}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: ["lessons", id, "resources"],
		updater: (res) => removeFromArray(res.id),
		optimistic: (resourceId) => removeFromArray(resourceId),
		showToast: true,
	});
}

// Ownership-gated — see useLessonContentQuery above for why.
export function useLessonResourcesQuery(id: string) {
	return useAppQuery(["lessons", id, "resources"], () =>
		apiRequest({ url: `/api/v1/lessons/${id}/manage/resources`, method: "GET" }, z.array(LessonResourceZod)),
	);
}



