"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { UpsertNoteRequestZod, NoteResponseZod } from "@/schema/notes.types";
import { DeleteResponseZod } from "@/schema/common.types";

// Returns success:false (data: null) when the lesson has no note yet — the
// backend 404s in that case, which apiRequest already normalizes for us.
export function useNotesQuery(lessonId: string) {
	return useAppQuery(queryKeys.notes(lessonId), () =>
		apiRequest({ url: `/api/v1/notes?lesson_id=${lessonId}`, method: "GET" }, NoteResponseZod),
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
