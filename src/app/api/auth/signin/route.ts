import { connectDB } from '@/lib/db.connect';
import { User } from '@/models/user.models';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        await connectDB()

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const cookieStore = await cookies()

        cookieStore.set('session_id', user._id)
        cookieStore.set('isAuthenticated', 'true')
        cookieStore.set('role', user.role)

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
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}