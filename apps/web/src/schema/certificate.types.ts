import { z } from 'zod';
import { CourseInfoZod, InstructorInfoZod, UserInfoZod } from "@/schema/common.types";

export const CertificateZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    tutor: InstructorInfoZod,
    issued_at: z.string(),
});
export type Certificate = z.infer<typeof CertificateZod>;

export const CertificateVerificationZod = z.object({
    valid: z.boolean(),
    id: z.string().optional(),
    student: UserInfoZod.optional(),
    course: CourseInfoZod.optional(),
    tutor: InstructorInfoZod.optional(),
    issued_at: z.string().optional(),
});
export type CertificateVerification = z.infer<typeof CertificateVerificationZod>;
