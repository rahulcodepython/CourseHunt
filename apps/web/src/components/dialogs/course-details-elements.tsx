"use client";

import * as React from "react";
import { Icon, type IconName } from "@/components/common/icon";

export function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name={icon} className="size-3.5 shrink-0" />
        {label}
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

export function DetailRow({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <Icon name={icon} className="size-4 shrink-0" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon name={icon} className="size-4 text-muted-foreground" />
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-muted-foreground">—</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-green-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
