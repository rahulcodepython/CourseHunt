import { connectDB } from "@/lib/db.connect";
import { Course } from "@/models/course.models";

export async function GET(request: Request) {
    await connectDB();

    try {
        const courses = await Course.find().select("-__v -createdAt");

        return new Response(JSON.stringify(courses), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to retrieve courses" }), { status: 500 });
    }
}