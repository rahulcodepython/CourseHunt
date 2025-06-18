import { routeHandlerWrapper } from '@/action';
import { comparePassword } from '@/lib/encryption';
import { User } from '@/models/user.models';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const POST = routeHandlerWrapper(async (request: Request) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const cookieStore = await cookies()

        cookieStore.set({
            name: 'session_id',
            value: user._id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
})