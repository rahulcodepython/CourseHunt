import { connectDB } from "@/lib/db.connect";
import { Course } from "@/models/course.models";

export async function GET(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    await connectDB();

    try {
        const course = await Course.findById(_id)

        return new Response(JSON.stringify(course), { status: 200 });
    } catch {
        return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    await connectDB();

    const courseData = await request.json()

    try {
        const updatedCourse = await Course.findByIdAndUpdate(_id, courseData, { new: true });

        return new Response(JSON.stringify(updatedCourse), { status: 200 });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to update course" }), { status: 400 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    await connectDB();

    try {
        await Course.findByIdAndDelete(_id);

        return new Response(JSON.stringify({ message: "Course deleted successfully" }), { status: 200 });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to delete course" }), { status: 400 });
    }
}