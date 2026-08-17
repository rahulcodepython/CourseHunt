import { NextRequest, NextResponse } from "next/server";
import { COOKIES, ROUTES } from "@/lib/const";
import { isPublicPath } from "@/lib/public-routes";

export default function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get(COOKIES.SESSION_TOKEN)?.value;

    const isAuthenticated = Boolean(sessionCookie);
    const { pathname } = request.nextUrl;

    if (!isAuthenticated && !isPublicPath(pathname)) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
