import { z } from 'zod';

export const CategoryZod: z.ZodType = z.object({
    id: z.string(),
    parent_id: z.string().nullable().optional(),
    name: z.string(),
    created_at: z.string(),
    subcategories: z.array(z.lazy(() => CategoryZod)).optional(),
});
export type Category = z.infer<typeof CategoryZod>;

export const CreateCategoryRequestZod = z.object({
    name: z.string(),
    parent_id: z.string().nullable().optional(),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestZod>;

export const UpdateCategoryRequestZod = z.object({
    name: z.string(),
});
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestZod>;
