import { routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const cookieStore = await cookies()

    try {
        const sessionId = cookieStore.get("session_id")?.value;
        const isAuthenticated = cookieStore.has("session_id")

        const user = await User.findById(sessionId).select("-password -__v");

        if (!user || !isAuthenticated) {
            cookieStore.delete("session_id");
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch {
        cookieStore.delete("session_id");
        return NextResponse.json({ user: null }, { status: 401 });
    }
})