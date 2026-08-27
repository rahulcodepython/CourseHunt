import { z } from 'zod';
import { UserInfoZod, CourseInfoZod } from "@/schema/common.types";

export const ListEnrollmentResponseZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    completion_percent: z.number(),
    completed: z.boolean(),
    revoked: z.boolean(),
    enrolled_at: z.string(),
});
export type ListEnrollmentResponse = z.infer<typeof ListEnrollmentResponseZod>;
