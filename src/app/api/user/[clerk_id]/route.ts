import { connectDB } from "@/lib/db.connect";
import { User } from "@/models/user.models";

export async function POST(request: Request, { params }: { params: Promise<{ clerk_id: string }> }) {
    const { clerk_id } = await params;

    if (!clerk_id) {
        return new Response(JSON.stringify({ 'error': 'Clerk ID is required' }), { status: 400 });
    }

    try {
        await connectDB()

        const body = await request.json();

        const user = await User.findOne({ clerk_id });

        if (!user) {
            const newUser = new User({
                clerk_id,
                email: body.email || '',
            })

            await newUser.save();

            return new Response(JSON.stringify({ user: newUser }), { status: 201 });
        }

        return new Response(JSON.stringify({ user }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ 'error': 'Failed to fetch user data' }), { status: 500 });
    }
}
