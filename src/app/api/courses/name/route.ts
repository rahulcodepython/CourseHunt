import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof Response) {
        return user;
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id });

    if (!courseRecord) {
        return NextResponse.json({ courses: [] }, { status: 200 });
    }

    const objectIds = courseRecord.courses.map((item: { courseId: string }) => new Types.ObjectId(item.courseId));

    const courses = await Course.find({ _id: { $in: objectIds } }, {
        _id: 1,
        title: 1,
    });

    return NextResponse.json({ courses }, { status: 200 });
});
