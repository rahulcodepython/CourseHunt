import { connectDB } from "@/lib/db.connect";
import { encryptPassword } from "@/lib/encryption";
import { Stats } from "@/models/stats.models";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, password } = body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
        }

        await connectDB()

        const user = await User.findOne({
            email: email
        })

        if (user) {
            return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
        }

        const encryptedPassword = await encryptPassword(password);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: encryptedPassword, // In a real application, ensure to hash the password before saving
            name: `${firstName} ${lastName}`,
        })
        await newUser.save();

        const stats = await Stats.findOne().sort({ lastUpdated: -1 }).limit(1);

        if (!stats) {
            const newStats = new Stats({
                totalStudents: 1,
                activeCourses: 0,
                monthlyRevenue: 0,
                totalRevenue: 0,
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear().toString(),
            });
            await newStats.save();
        } else {
            if (stats.month !== new Date().toLocaleString('default', { month: 'long' }) || stats.year !== new Date().getFullYear().toString()) {
                const newStats = new Stats({
                    totalStudents: stats.totalStudents + 1,
                    activeCourses: stats.activeCourses,
                    monthlyRevenue: 0,
                    totalRevenue: stats.totalRevenue,
                    month: new Date().toLocaleString('default', { month: 'long' }),
                    year: new Date().getFullYear().toString(),
                });
                await newStats.save();
            } else {
                stats.totalStudents += 1;
                stats.lastUpdated = new Date();
                await stats.save();
            }
        }

        const cookieStore = await cookies()

        cookieStore.set({
            name: 'session_id',
            value: newUser._id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return new Response(JSON.stringify({
            message: 'Registration successful',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                createdAt: newUser.createdAt
            }
        }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}