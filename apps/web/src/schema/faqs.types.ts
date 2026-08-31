import { z } from "zod";

export const FaqZod = z.object({
  id: z.string(),
  course_id: z.string(),
  question: z.string(),
  answer: z.string(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Faq = z.infer<typeof FaqZod>;

// sort_order is auto-incremented server-side — never sent by the client.
export const CreateFaqRequestZod = z.object({
  question: z.string(),
  answer: z.string(),
});
export type CreateFaqRequest = z.infer<typeof CreateFaqRequestZod>;

export const UpdateFaqRequestZod = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});
export type UpdateFaqRequest = z.infer<typeof UpdateFaqRequestZod>;
