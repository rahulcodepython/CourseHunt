import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "kysely";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    try {
        await sql`UPDATE users SET "passwordChangedAt" = NOW() WHERE id = ${user.id}`.execute(db);
    } catch {
        return NextResponse.json({ success: false, message: "Failed to update password status." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}