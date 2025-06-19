// middleware.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/admin', '/user', '/checkout', '/study'];
const unauthenticatedRoutePrefix = '/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id');

    const isAuthenticated = !!sessionId;

    // Redirect unauthenticated users from protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from the login/signup pages
    if (pathname.startsWith(unauthenticatedRoutePrefix) && isAuthenticated) {
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};



