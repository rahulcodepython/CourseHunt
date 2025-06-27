import { connectDB } from '@/lib/db.connect';
import { User } from '@/models/user.models';
import { UserType } from '@/types/user.type';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

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
        console.error(`API Error from: ${req.url}:`, error);
        return new Response(JSON.stringify(
            { error: "Internal Server Error" }
        ), { status: 500 });
    }
};

export const checkAuthencticatedUserRequest = async (): Promise<NextResponse | UserType> => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(sessionId.value).select('-password -__v');

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return user as UserType;
}

export const checkAdminUserRequest = async (): Promise<NextResponse | UserType> => {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(sessionId.value).select('-password -__v');

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return user as UserType
}