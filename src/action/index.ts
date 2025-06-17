import { connectDB } from '@/lib/db.connect';
import { User } from '@/models/user.models';
import { UserType } from '@/types/user.type';
import { cookies, headers } from 'next/headers';

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

export const checkAuthencticatedUserRequest = async (): Promise<null | UserType> => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id');

    if (!sessionId) {
        return null;
    }

    const user = await User.findById(sessionId.value);

    if (!user) {
        return null;
    }

    return user
}

export const checkAdminUserRequest = async (): Promise<null | UserType> => {
    console.log("Checking admin user request...");

    const cookieStore = await cookies();
    console.log("Cookie Store:", cookieStore);

    const sessionId = cookieStore.get('session_id');
    console.log("Session ID:", sessionId?.value);

    if (!sessionId) {
        return null;
    }

    const user = await User.findById(sessionId.value);
    console.log("User:", user);

    if (!user) {
        return null;
    }

    if (user.role !== 'admin') {
        return null;
    }

    return user
}