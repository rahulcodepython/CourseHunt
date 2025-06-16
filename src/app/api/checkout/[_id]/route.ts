import { Course } from "@/models/course.models";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";

export async function GET(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    try {
        const cookieStore = await cookies();

        if (!cookieStore.has("session_id")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { _id } = await params;

        if (!_id) {
            return new Response(JSON.stringify({ error: "Course ID is required" }), { status: 400 });
        }

        const userId = cookieStore.get("session_id")?.value;

        const user = await User.findById(userId)

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        const course = await Course.findById(_id)

        if (!course) {
            return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
        }

        const courseResponse = {
            _id: course._id,
            title: course.title,
            price: course.price,
            originalPrice: course.originalPrice,
            imageUrl: course.imageUrl,
            category: course.category,
        }

        const userResponse = {
            _id: user._id,
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
            address: user.address ?? "",
            city: user.city ?? "",
            country: user.country ?? "",
            zip: user.zip ?? "",
        }

        return new Response(JSON.stringify({ course: courseResponse, user: userResponse }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error fetching course data" }), { status: 500 });
    }
}