import { connectDB } from "@/lib/db.connect";
import { Course } from "@/models/course.models";

export async function GET(request: Request, { params }: { params: Promise<{ _id: string }> }) {
    const { _id } = await params;

    try {
        // Assuming connectDB and Course are already imported
        await connectDB();

        const course = await Course.findById(_id, {
            _id: 1, // Optional for cases where the ID is not needed
            title: 1,
            description: 1,
            duration: 1,
            students: 1,
            rating: 1,
            reviews: 1,
            price: 1,
            originalPrice: 1,
            category: 1,
            discount: 1,
            imageUrl: 1,
            previewVideoUrl: 1,
            longDescription: 1,
            whatYouWillLearn: 1,
            prerequisites: 1,
            requirements: 1,
            faq: 1,
            chaptersCount: 1,
            lessonsCount: 1,
            createdAt: 1,
            updatedAt: 1,
            chapters: {
                title: 1,
                preview: 1,
                lessons: {
                    title: 1,
                    duration: 1,
                    type: 1,
                },
                totallessons: 1
            }
        }).lean();

        if (!course) {
            return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(course), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch course" }), { status: 500 });
    }
}