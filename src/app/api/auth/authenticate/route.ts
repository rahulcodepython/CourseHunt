import { routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    try {
        const cookieStore = await cookies()

        const sessionId = cookieStore.get("session_id")?.value;
        const isAuthenticated = cookieStore.has("session_id")

        const user = await User.findById(sessionId).select("-password -__v");

        if (!user || !isAuthenticated) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
})