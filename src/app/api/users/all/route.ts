import { connectDB } from "@/lib/db.connect";
import { User } from "@/models/user.models";
import { NextResponse } from "next/server";

export async function GET() {
    await connectDB();

    const users = await User.find().select('-password -__v');

    return NextResponse.json(users);
}