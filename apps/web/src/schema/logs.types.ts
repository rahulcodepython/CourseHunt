import { z } from "zod";

export const LogEntryZod = z.object({
  id: z.number(),
  message: z.string(),
  actor_email: z.string().nullable(),
  success: z.boolean(),
  created_at: z.string(),
});
export type LogEntry = z.infer<typeof LogEntryZod>;
