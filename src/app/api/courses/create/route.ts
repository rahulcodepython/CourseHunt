import { routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const body = await request.json();
    const { title } = body;

    if (!title) {
        return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
    }

    const course = new Course({
        title: title,
        description: "Default description",
        duration: "0 hours",
        students: 0,
        rating: 0,
        reviews: 0,
        price: 0,
        originalPrice: 0,
        category: "Default Category",
        discount: "0%",
        imageUrl: {
            url: "",
            thumbnailUrl: "",
            fileType: "",
        },
        previewVideoUrl: {
            url: "",
            thumbnailUrl: "",
            fileType: "",
        },
        longDescription: "Default long description",
        whatYouWillLearn: ["Default learning point 1", "Default learning point 2"],
        prerequisites: ["Default prerequisite 1"],
        requirements: ["Default requirement 1"],
        chapters: [
            {
                title: "Default chapter title",
                preview: false,
                lessons: [
                    {
                        title: "Default lesson title",
                        duration: "0 minutes",
                        type: "video",
                        videoUrl: {
                            url: "",
                            thumbnailUrl: "",
                            fileType: "",
                        },
                        content: "Default lesson content",
                    },
                ],
                totallessons: 1,
            },
        ],
        chaptersCount: 1,
        lessonsCount: 1,
        isPublished: false,
        faq: [
            {
                question: "Default question?",
                answer: "Default answer.",
            },
        ],
        resources: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const newCourse = await course.save();

    const responseCourse = {
        _id: newCourse._id,
        title: newCourse.title,
        description: newCourse.description,
        duration: newCourse.duration,
        students: newCourse.students,
        rating: newCourse.rating,
        reviews: newCourse.reviews,
        price: newCourse.price,
        originalPrice: newCourse.originalPrice,
        category: newCourse.category,
        discount: newCourse.discount,
        imageUrl: newCourse.imageUrl,
    };

    return new Response(JSON.stringify({ message: "Course created successfully", course: responseCourse }), { status: 201 });
});
