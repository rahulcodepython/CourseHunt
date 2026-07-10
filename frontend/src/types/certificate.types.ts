import { z } from 'zod';
import { CourseInfoZod } from './common.types';

export const CertificateResponseZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course_id: z.string(),
    course_title: z.string(),
    issued_at: z.string(),
});
export type CertificateResponse = z.infer<typeof CertificateResponseZod>;

export const CertificateZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    issued_at: z.string(),
});
export type Certificate = z.infer<typeof CertificateZod>;
export const CertificateZod = z.any(); export type Certificate = any;
