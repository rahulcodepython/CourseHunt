import { CourseInfoZod, UserInfoZod } from '@/types/common.types';
import { z } from 'zod';

export const EnrollmentZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    completion_percent: z.number(),
    completed: z.boolean(),
    last_accessed_lesson_id: z.string().optional(),
    revoked: z.boolean(),
    enrolled_at: z.string(),
});
export type Enrollment = z.infer<typeof EnrollmentZod>;

export const ManualEnrollRequestZod = z.object({
    user_id: z.string(),
});
export type ManualEnrollRequest = z.infer<typeof ManualEnrollRequestZod>;