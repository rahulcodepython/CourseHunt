import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (req: Request, params: { _id: string }) => {
    const user = await checkAuthencticatedUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();

    if (!cookieStore.has("session_id")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { _id } = params;

    if (!_id) {
        return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const course = await Course.findById(_id)

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
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

    return NextResponse.json({ course: courseResponse, user: userResponse }, { status: 200 });
})