import { z } from "zod";

export const NotificationZod = z.object({
  id: z.coerce.number(),
  type: z.string(),
  message: z.string(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationZod>;
