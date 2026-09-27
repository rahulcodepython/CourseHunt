"use client";

import { useQuery } from "@tanstack/react-query";
import { request, ApiError } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { UpsertNoteRequestZod, NoteResponseZod } from "@/schema/notes.types";
import { DeleteResponseZod } from "@/schema/common.types";

// Returns data: null when the lesson has no note yet (the backend 404s in that case).
export function useNotesQuery(lessonId: string) {
  return useQuery({ queryKey: queryKeys.notes(lessonId), queryFn: async () => {
    try {
      return await request(
        { url: "/api/v1/notes", method: "GET", params: { lesson_id: lessonId } },
        NoteResponseZod,
      );
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return { success: true, message: "No note yet", data: null };
      }
      throw err;
    }
  } });
}

export function useCreateNoteMutation(lessonId: string) {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof UpsertNoteRequestZod>) =>
      request(
        { url: "/api/v1/notes", method: "POST", params: { lesson_id: lessonId }, data },
        NoteResponseZod,
      ),
    invalidateKeys: [queryKeys.notes(lessonId)],
    showToast: true,
  });
}

export function useDeleteNoteMutation(lessonId: string) {
  return useSimpleMutation({
    mutationFn: (id: string) =>
      request({ url: `/api/v1/notes/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.notes(lessonId)],
    showToast: true,
  });
}

export function useUpdateNoteMutation(lessonId: string) {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpsertNoteRequestZod> }) =>
      request({ url: `/api/v1/notes/${id}`, method: "PATCH", data }, NoteResponseZod),
    invalidateKeys: [queryKeys.notes(lessonId)],
    showToast: true,
  });
}
