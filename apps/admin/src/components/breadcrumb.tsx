"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function BreadcrumbComponent() {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathParts.map((part, index) => {
          const href = `/${pathParts.slice(0, index + 1).join("/")}`;
          const formatted = part
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <Link href={href} className="text-sm font-medium transition-colors hover:text-foreground">
                  {formatted}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="last:hidden" />
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default BreadcrumbComponent;
