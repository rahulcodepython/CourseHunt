import type { NavGroup, NavItem } from "@/components/app-sidebar";

/**
 * Generic permission-gating helpers driven entirely by nav-config data
 * (e.g. `@/config/nav-admin.json`) — no route/permission pairs are
 * hardcoded here, so a future tutor/user dashboard can reuse the same
 * functions against its own nav config.
 */

export function hasPermission(userPermissions: string[], required?: string | null): boolean {
  return !required || userPermissions.includes(required);
}

/** Drops nav items/children the user lacks permission for, and drops groups left empty. */
export function filterNavGroups(groups: NavGroup[], userPermissions: string[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item): NavItem | null => {
          if (item.children?.length) {
            const children = item.children.filter((child) =>
              hasPermission(userPermissions, child.permission),
            );
            return children.length > 0 ? { ...item, children } : null;
          }
          return hasPermission(userPermissions, item.permission) ? item : null;
        })
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}

/** Top-level route segment (e.g. "/courses") -> required permission. */
export type RoutePermissionMap = Record<string, string | null | undefined>;

/** Flattens a nav config into a route->permission lookup, meant to be built once and reused. */
export function buildRoutePermissionMap(groups: NavGroup[]): RoutePermissionMap {
  const map: RoutePermissionMap = {};
  for (const group of groups) {
    for (const item of group.items) {
      for (const entry of item.children ?? [item]) {
        if (entry.href) map[entry.href] = entry.permission;
      }
    }
  }
  return map;
}

/** "/courses/123/edit" -> "/courses", so nested pages inherit their section's gate. */
function routeSegment(pathname: string): string {
  if (pathname === "/") return "/";
  const end = pathname.indexOf("/", 1);
  return end === -1 ? pathname : pathname.slice(0, end);
}

/** O(1) lookup against a precomputed map. Unmapped routes / null permissions are always allowed. */
export function isRouteAllowed(
  pathname: string,
  routeMap: RoutePermissionMap,
  userPermissions: string[],
): boolean {
  return hasPermission(userPermissions, routeMap[routeSegment(pathname)]);
}
