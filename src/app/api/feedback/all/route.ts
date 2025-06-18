import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Feedback } from "@/models/feedback.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbacks = await Feedback.find();

    return NextResponse.json({ feedbacks }, { status: 200 });
});
