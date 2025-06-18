import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    await checkAuthencticatedUserRequest()

    const courses = await Course.find({}, {
        _id: 1,
        title: 1,
    });

    return NextResponse.json({ courses }, { status: 200 });
});
