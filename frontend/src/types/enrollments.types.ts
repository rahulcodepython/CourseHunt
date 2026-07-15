import { UserInfoZod } from '@/types/common.types';
import { z } from 'zod';

export const ListEnrollmentResponseZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    completion_percent: z.number(),
    completed: z.boolean(),
    revoked: z.boolean(),
    enrolled_at: z.string(),
});
export type ListEnrollmentResponse = z.infer<typeof ListEnrollmentResponseZod>;
