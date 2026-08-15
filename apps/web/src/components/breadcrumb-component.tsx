"use client";

import * as React from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { useBreadcrumbStore } from "@/store/breadcrumb.store";
import { ROUTES } from "@/lib/const";

export default function BreadcrumbComponent() {
    const items = useBreadcrumbStore((s) => s.items);
    const pathname = usePathname();
    const rootHref = pathname.startsWith(ROUTES.TUTOR_DASHBOARD)
        ? ROUTES.TUTOR_DASHBOARD
        : ROUTES.ADMIN_DASHBOARD;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    {
                        items.length === 0 ? <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            : <BreadcrumbLink asChild>
                                <Link href={rootHref}>Dashboard</Link>
                            </BreadcrumbLink>
                    }
                </BreadcrumbItem>
                {
                    items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        return <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {
                                    isLast || !item.href ? <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        : <BreadcrumbLink asChild>
                                            <Link href={item.href}>{item.label}</Link>
                                        </BreadcrumbLink>
                                }
                            </BreadcrumbItem>
                        </React.Fragment>
                    })
                }
            </BreadcrumbList>
        </Breadcrumb>
    );
}
