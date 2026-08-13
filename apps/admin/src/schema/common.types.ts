import { z } from 'zod';

export const PaginatedResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: z.array(dataSchema),
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

export const JwtPayloadZod = z.object({
    sub: z.string(),
    roles: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
    banned: z.boolean().default(false),
    iat: z.number().optional(),
    exp: z.number().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadZod>;

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

export const ApiResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional().nullable(),
    error: z.string().optional().nullable(),
});

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data?: T | null;
    error?: string | null;
};