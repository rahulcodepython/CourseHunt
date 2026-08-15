import { z } from 'zod';
import { CourseInfoZod } from "@/schema/common.types";

export const CertificateZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    issued_at: z.string(),
});
export type Certificate = z.infer<typeof CertificateZod>;
