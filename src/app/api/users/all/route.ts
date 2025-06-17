import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await User.find().select('-password -__v');
    return NextResponse.json(users);
});
