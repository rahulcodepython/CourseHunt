import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { cookies } from "next/headers";

export const DELETE = routeHandlerWrapper(async () => {
    const auth = await checkAuthencticatedUserRequest()

    if (!auth) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const cookieStore = await cookies();

    cookieStore.delete("session_id");

    return new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
})