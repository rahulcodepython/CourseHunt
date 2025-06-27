import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { CourseRecord } from "@/models/course.record.models";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

interface EnrolledCourse {
    imageUrl: { url: string, fileType: string },
    title: string,
    completedLessons: number,
    totalLessons: number,
    _id: string
}

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof NextResponse) {
        return user;
    }

    const enrolledCourses = await CourseRecord.aggregate([
        {
            $match: { userId: new Types.ObjectId(user._id) }
        },
        {
            $lookup: {
                from: 'courses', // matches the name of the Course collection (should be lowercase plural)
                localField: 'courseId',
                foreignField: '_id',
                as: 'courseInfo'
            }
        },
        { $unwind: '$courseInfo' },
        {
            $project: {
                _id: '$courseInfo._id',
                title: '$courseInfo.title',
                imageUrl: '$courseInfo.imageUrl',
                totalLessons: '$courseInfo.chaptersCount',
                completedLessons: '$completedLessons',
            }
        }
    ]);

    const responseData = {
        user: {
            name: user.name,
        },
        courses: enrolledCourses,
        enrolledCourses: user.purchasedCourses,
    };

    return NextResponse.json(responseData, { status: 200 });
});