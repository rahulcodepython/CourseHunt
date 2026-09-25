"use client";

import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];
type RoleItem = { id?: string; name: string } | string;

/** Renders a user/admin's role(s) as badges, falling back to a single derived role when the roles array is empty. */
export function RolesCell({
  roles,
  fallbackRole,
  variantFor,
  emptyLabel,
}: {
  roles: RoleItem[] | null | undefined;
  fallbackRole?: string | null;
  variantFor: (name: string) => BadgeVariant;
  /** Rendered when there's no role at all (no roles array, no fallbackRole). */
  emptyLabel?: string;
}) {
  const list: RoleItem[] =
    Array.isArray(roles) && roles.length > 0
      ? roles
      : fallbackRole
        ? [{ id: fallbackRole, name: fallbackRole }]
        : [];

  if (list.length === 0) {
    return emptyLabel ? <Badge variant="outline">{emptyLabel}</Badge> : null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {list.map((r, idx) => {
        const name = typeof r === "object" && r !== null ? r.name : String(r);
        const key = typeof r === "object" && r !== null ? r.id || idx : `${r}-${idx}`;
        return (
          <Badge key={key} variant={variantFor(name)} className="capitalize">
            {name}
          </Badge>
        );
      })}
    </div>
  );
}
