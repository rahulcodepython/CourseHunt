import { z } from 'zod';

export const UploadMediaResponseZod = z.object({
    downloadUrl: z.string(),
    htmlUrl: z.string(),
    status: z.number(),
});
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseZod>;
