import { connectDB } from "@/lib/db.connect";
import { Course } from "@/models/course.models";

export async function GET(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    await connectDB();

    const course = await Course.findById(_id)

    if (!course) {
        return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ course: course }), { status: 200 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    await connectDB();

    const courseData = await request.json()

    const updatedCourse = await Course.findByIdAndUpdate(_id, courseData, { new: true });

    if (!updatedCourse) {
        return new Response(JSON.stringify({ error: "Failed to update course" }), { status: 400 });
    }

    return new Response(JSON.stringify({ course: updatedCourse }), { status: 200 });
}