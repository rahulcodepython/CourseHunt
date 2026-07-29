import { NextRequest, NextResponse } from "next/server";

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function hasRole(payload: Record<string, unknown> | null, role: string): boolean {
  if (!payload) return false;
  const roles = payload.roles as string[] | undefined;
  return Array.isArray(roles) && roles.includes(role);
}

export function hasAnyRole(payload: Record<string, unknown> | null, roles: string[]): boolean {
  if (!payload) return false;
  const userRoles = payload.roles as string[] | undefined;
  return Array.isArray(userRoles) && roles.some((r) => userRoles.includes(r));
}

export function isBanned(payload: Record<string, unknown> | null): boolean {
  return payload?.banned === true;
}

export function needsPasswordChange(payload: Record<string, unknown> | null): boolean {
  return payload?.passwordChangedAt == null;
}

export function isPathMatch(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function getSessionCookie(request: NextRequest): string | undefined {
  return request.cookies.get("access_token")?.value;
}

export function redirectTo(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}