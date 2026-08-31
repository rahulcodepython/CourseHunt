import { z } from "zod";

export const UpsertNoteRequestZod = z.object({
  content: z.string(),
});
export type UpsertNoteRequest = z.infer<typeof UpsertNoteRequestZod>;

export const NoteResponseZod = z.object({
  id: z.string(),
  content: z.string(),
  updated_at: z.string(),
});
export type NoteResponse = z.infer<typeof NoteResponseZod>;
