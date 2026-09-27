import { z } from "zod";

export const PaginatedResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      data: z.array(dataSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      has_more: z.boolean().optional(),
    })
    .transform((val) => ({
      ...val,
      has_more: val.has_more ?? val.page * val.limit < val.total,
    }));

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more?: boolean;
}

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

// Same shape as UserInfoZod — kept as a distinct export since call sites
// import it under this name for an instructor specifically, but it's an
// alias, not an independently-maintained schema.
export const InstructorInfoZod = UserInfoZod;

export const CategoryInfoZod = z.object({
  id: z.string(),
  name: z.string(),
});

export const CourseInfoZod = z.object({
  id: z.string(),
  slug: z.string().optional(),
  title: z.string(),
  thumbnail: z.string().nullable().optional(),
});

export const CouponInfoZod = z.object({
  id: z.string(),
  code: z.string(),
  discount_value: z.number(),
});

export const ApiResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional().nullable(),
    error: z.string().optional().nullable(),
  });

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
