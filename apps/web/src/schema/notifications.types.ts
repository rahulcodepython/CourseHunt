import { z } from "zod";

export const NotificationZod = z.object({
  id: z.number(),
  type: z.enum(["login", "purchase", "discussion", "feedback", "system_error"]),
  message: z.string(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationZod>;
