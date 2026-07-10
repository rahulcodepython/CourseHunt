import { z } from 'zod';

export const PaginatedResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema,
        total: z.number(),
        page: z.number(),
        limit: z.number(),
    });
export type PaginatedResponse = z.infer<typeof PaginatedResponseZod>;

export const UserInfoZod = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
});
export type UserInfo = z.infer<typeof UserInfoZod>;

export const InstructorInfoZod = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    headline: z.string().optional(),
});
export type InstructorInfo = z.infer<typeof InstructorInfoZod>;

export const CategoryInfoZod = z.object({
    id: z.string(),
    name: z.string(),
});
export type CategoryInfo = z.infer<typeof CategoryInfoZod>;

export const CourseInfoZod = z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string().optional(),
});
export type CourseInfo = z.infer<typeof CourseInfoZod>;

export const CouponInfoZod = z.object({
    id: z.string(),
    code: z.string(),
    discount_value: z.number(),
});
export type CouponInfo = z.infer<typeof CouponInfoZod>;
