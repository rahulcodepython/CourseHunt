import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const adminRoute = "/admin";

const protectedRoutes = [
    '/user',
    '/checkout',
]

const unauthenticatedRoute = "/auth"

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const cookieStore = await cookies()

    const isAuthenticated = cookieStore.has('session_id')
    const isAdmin = cookieStore.get('role')?.value === 'admin'

    if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (pathname.startsWith(adminRoute)) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        if (!isAdmin) {
            return NextResponse.redirect(new URL('/user', request.url));
        }
    }

    if (pathname.startsWith(unauthenticatedRoute) && isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/(.*)',
}