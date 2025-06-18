import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    await checkAdminUserRequest();

    const users = await User.find().select('-password -__v');

    return NextResponse.json(users);
});
