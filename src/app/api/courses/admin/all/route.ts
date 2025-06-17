import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await Course.find().select("-__v -createdAt");
    return new Response(JSON.stringify(courses), { status: 200 });
});
// import { cookies } from "next/headers";

// export async function GET() {
//     const cookieStore = await cookies();
//     console.log("Cookie Store:", cookieStore);

//     return new Response(JSON.stringify({ message: "Hello, World!" }), {
//         status: 200,
//         headers: {
//             "Content-Type": "application/json",
//         },
//     });
// }