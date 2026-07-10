"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { UserNoteZod, UpsertNoteRequestZod, NoteResponseZod } from "@/types/notes.types";



/**
 * Fetches notes for a lesson.
 */
export function useNotesQuery(lessonId: string) {
	return useApiQuery(queryKeys.notes(lessonId), () =>
		apiRequest({ url: `/api/v1/notes/lesson/${lessonId}`, method: "GET" }, z.array(UserNoteZod)),
	);
}

/**
 * Creates a new note for a lesson.
 * Cache strategy: appends to notes list.
 */
export function useCreateNoteMutation(lessonId: string, courseId: string) {
	return useApiMutation(
		(data: z.infer<typeof UpsertNoteRequestZod>) =>
			apiRequest({ url: `/api/v1/notes/course/${courseId}/lesson/${lessonId}`, method: "POST", data }, NoteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.notes(lessonId),
				updater: cache.append(),
			},
			successMessage: "Note created successfully",
		},
	);
}

/**
 * Deletes a note.
 * Cache strategy: removes matching note from the list.
 */
export function useDeleteNoteMutation(lessonId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/notes/${id}`, method: "DELETE" }, z.any()),
		{
			updateCache: {
				queryKey: queryKeys.notes(lessonId),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Note deleted successfully",
		},
	);
}

/**
 * Updates a note.
 * Cache strategy: updates matching note in the list.
 */
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
