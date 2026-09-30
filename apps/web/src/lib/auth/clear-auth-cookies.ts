"use client";

import authClient from "@/lib/auth/auth-client";

/**
 * Clears all session and authentication cookies across paths and domains,
 * removes local storage caches, and invalidates the Better-Auth session.
 */
export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  const cookieNames = [
    "better-auth.session_token",
    "better-auth.session_data",
    "access_token",
    "refresh_token",
    "session_token",
  ];

  const host = window.location.hostname;
  const domainParts = host.split(".");

  cookieNames.forEach((name) => {
    // 1. Clear for root path without domain
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

    // 2. Clear for current hostname
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${host}; SameSite=Lax`;

    // 3. Clear for parent domain if host has subdomains (e.g. .localhost or .coursehunt.com)
    if (domainParts.length > 1) {
      const parentDomain = "." + domainParts.slice(-2).join(".");
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${parentDomain}; SameSite=Lax`;
    }
  });

  // Clear localStorage session snapshot
  try {
    localStorage.removeItem("coursehunt-session-storage");
  } catch {}

  // Trigger better-auth client signOut best-effort to clear server session cookies
  try {
    authClient.signOut().catch(() => {});
  } catch {}
}
