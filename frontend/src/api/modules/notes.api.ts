"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { UserNoteZod, UpsertNoteRequestZod, NoteResponseZod } from "@/types/notes.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useNotesQuery(lessonId: string) {
	return useApiQuery(queryKeys.notes(lessonId), () =>
		apiRequest({ url: `/api/v1/notes?lesson_id=${lessonId}`, method: "GET" }, UserNoteZod),
	);
}

export function useCreateNoteMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertNoteRequestZod>) =>
			apiRequest({ url: `/api/v1/notes?lesson_id=${lessonId}`, method: "POST", data }, NoteResponseZod),
		{
			invalidateKeys: [queryKeys.notes(lessonId)],
			successMessage: "Note saved successfully",
		},
	);
}

export function useDeleteNoteMutation(lessonId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/notes/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.notes(lessonId)],
			successMessage: "Note deleted successfully",
		},
	);
}

export function useUpdateNoteMutation(lessonId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpsertNoteRequestZod> }) =>
			apiRequest({ url: `/api/v1/notes/${id}`, method: "PATCH", data }, NoteResponseZod),
		{
			invalidateKeys: [queryKeys.notes(lessonId)],
			successMessage: "Note updated successfully",
		},
	);
}
