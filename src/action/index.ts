import { connectDB } from '@/lib/db.connect';
import { headers } from 'next/headers';

export const getBaseUrl = async () => {
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host') || 'localhost:3000';

    return `${protocol}://${host}`;
};

export const routeHandlerWrapper = <T extends Record<string, any>>(
    handler: (req: Request, params: T) => Promise<Response>
) => async (req: Request, context: { params: Promise<T> }): Promise<Response> => {
    try {
        await connectDB();
        const params = await context.params;
        return await handler(req, params);
    } catch (error) {
        console.log(`API Error from: ${req.url}:`, error);
        return new Response(JSON.stringify(
            { error: "Internal Server Error" }
        ), { status: 500 });
    }
};
