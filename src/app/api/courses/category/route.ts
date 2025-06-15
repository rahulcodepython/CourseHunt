import { connectDB } from "@/lib/db.connect";
import { CourseCategory } from "@/models/course.category.models";

export async function GET(request: Request) {
    try {
        await connectDB();

        const courseCategories = await CourseCategory.find();

        return new Response(JSON.stringify(courseCategories), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch course categories" }), { status: 500 });
    }
}