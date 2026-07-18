"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { UserNoteZod, UpsertNoteRequestZod, NoteResponseZod } from "@/types/notes.types";
import { DeleteResponseZod } from "@/types/common.types";

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
