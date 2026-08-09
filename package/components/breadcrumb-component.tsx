"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@package/ui/breadcrumb";

const LABELS: Record<string, string> = {
  profile: "Profile",
  users: "Users",
  admins: "Admins",
  tutors: "Tutors",
  courses: "Courses",
  overview: "Overview",
  chapters: "Chapters",
  categories: "Categories",
  transactions: "Transactions",
  coupons: "Coupons",
  feedback: "Feedback",
  discussions: "Discussions",
  roles: "Roles & Permissions",
  security: "Security",
  monitoring: "Monitoring",
  logs: "Logs",
  "system-config": "System Config",
  maintenance: "Maintenance",
  updates: "Updates",
};

function humanize(segment: string): string {
  const clean = segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return LABELS[segment] ?? clean;
}

export function BreadcrumbComponent() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return { segment, href, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/" />}>
              Dashboard
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {items.map((item) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{humanize(item.segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href} />}>
                  {humanize(item.segment)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
