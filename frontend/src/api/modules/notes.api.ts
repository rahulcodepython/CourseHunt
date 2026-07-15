"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
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
			updateCache: {
				queryKey: queryKeys.notes(lessonId),
				updater: cache.replace(),
			},
			successMessage: "Note saved successfully",
		},
	);
}

export function useDeleteNoteMutation(lessonId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/notes/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.notes(lessonId),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Note deleted successfully",
		},
	);
}

export function useUpdateNoteMutation(lessonId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpsertNoteRequestZod> }) =>
			apiRequest({ url: `/api/v1/notes/${id}`, method: "PATCH", data }, NoteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.notes(lessonId),
				updater: cache.update((item: any, variables: any) => item.id === variables.id),
			},
			successMessage: "Note updated successfully",
		},
	);
}
