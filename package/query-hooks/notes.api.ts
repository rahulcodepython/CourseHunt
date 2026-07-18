"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { UserNoteZod, UpsertNoteRequestZod, NoteResponseZod } from "@/package/schema/notes.types";
import { DeleteResponseZod } from "@/package/schema/common.types";

export function useNotesQuery(lessonId: string) {
	return useAppQuery(queryKeys.notes(lessonId), () =>
		apiRequest({ url: `/api/v1/notes?lesson_id=${lessonId}`, method: "GET" }, UserNoteZod),
	);
}

export function useCreateNoteMutation(lessonId: string) {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof UpsertNoteRequestZod>) =>
			apiRequest({ url: `/api/v1/notes?lesson_id=${lessonId}`, method: "POST", data }, NoteResponseZod),
		invalidateKeys: [queryKeys.notes(lessonId)],
		showToast: true,
	});
}

export function useDeleteNoteMutation(lessonId: string) {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/notes/${id}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [queryKeys.notes(lessonId)],
		showToast: true,
	});
}

export function useUpdateNoteMutation(lessonId: string) {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpsertNoteRequestZod> }) =>
			apiRequest({ url: `/api/v1/notes/${id}`, method: "PATCH", data }, NoteResponseZod),
		invalidateKeys: [queryKeys.notes(lessonId)],
		showToast: true,
	});
}
