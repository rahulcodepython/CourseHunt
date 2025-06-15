import { User } from "@/models/user.models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const cookieStore = await cookies()

    const sessionId = cookieStore.get("session_id")?.value;
    const isAuthenticated = cookieStore.get("isAuthenticated")?.value === "true";

    const user = await User.findById(sessionId).select("-password -__v");

    if (!user || !isAuthenticated) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
}