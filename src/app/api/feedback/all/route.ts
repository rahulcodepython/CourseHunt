import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Feedback } from "@/models/feedback.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    await checkAdminUserRequest()

    const feedbacks = await Feedback.find();

    return NextResponse.json({ feedbacks }, { status: 200 });
});
