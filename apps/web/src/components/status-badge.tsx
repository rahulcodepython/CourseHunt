"use client";

import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export interface StatusBadgeEntry {
  label?: string;
  variant?: BadgeVariant;
  className?: string;
  /** Adds a small leading dot indicator (e.g. a pulsing "live/ongoing" marker). */
  dot?: boolean;
}

/** Data-driven status -> badge lookup, replacing hand-rolled if/else badge chains. */
export function StatusBadge({
  status,
  map,
  fallback,
}: {
  status: string;
  map: Record<string, StatusBadgeEntry>;
  fallback?: StatusBadgeEntry;
}) {
  const entry = map[status] ?? fallback ?? {};
  return (
    <Badge variant={entry.variant ?? "outline"} className={cn("capitalize", entry.className)}>
      {entry.dot && <span className="size-1.5 rounded-full bg-white" />}
      {entry.label ?? status}
    </Badge>
  );
}
