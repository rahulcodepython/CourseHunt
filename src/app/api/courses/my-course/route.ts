import { connectDB } from "@/lib/db.connect";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    try {
        await connectDB();

        const cookieStore = await cookies();

        const userId = cookieStore.get('session_id')?.value;

        console.log("User ID from cookies:", userId);

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
        }

        const purchasedCourses = []

        const user = await User.findById(userId)

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        console.log("User ID:", user);

        // for (const _id of user.purchasedCourses) {
        //     purchasedCourses.push(_id);
        // }

        // console.log("Purchased Courses:", purchasedCourses);
        return new Response(JSON.stringify(`{ purchasedCourses }`), { status: 200 });
    } catch (error) {
        console.error("Error fetching purchased courses:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}