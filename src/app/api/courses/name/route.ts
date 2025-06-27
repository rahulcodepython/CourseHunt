import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { CourseRecord } from "@/models/course.record.models";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof Response) {
        return user;
    }

    const courses = await CourseRecord.aggregate([
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
                totalLessons: '$courseInfo.chaptersCount',
                completedLessons: '$completedLessons',
            }
        }
    ]);

    return NextResponse.json({ courses }, { status: 200 });
});
