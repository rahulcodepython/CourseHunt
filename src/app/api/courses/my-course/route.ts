import { routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_id')?.value;

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    const user = await User.findById(userId);

    if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const purchasedCourses = user.purchasedCourses || [];

    return new Response(JSON.stringify({ purchasedCourses }), { status: 200 });
});
