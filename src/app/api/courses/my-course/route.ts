import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }


    const purchasedCourses = user.purchasedCourses || [];

    return new Response(JSON.stringify({ purchasedCourses }), { status: 200 });
});
