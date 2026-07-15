import { z } from 'zod';

export const PaginatedResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema,
        total: z.number(),
        page: z.number(),
        limit: z.number(),
    });

export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
};

export const DeleteResponseZod = z.object({
    id: z.string(),
});
export type DeleteResponse = z.infer<typeof DeleteResponseZod>;

export const SuccessResponseZod = z.object({
    success: z.boolean(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseZod>;

export const UserInfoZod = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable().optional(),
});

export const InstructorInfoZod = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable().optional(),
    headline: z.string().nullable().optional(),
});

export const CategoryInfoZod = z.object({
    id: z.string(),
    name: z.string(),
});

export const CourseInfoZod = z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string().nullable().optional(),
});

export const CouponInfoZod = z.object({
    id: z.string(),
    code: z.string(),
    discount_value: z.number(),
});
