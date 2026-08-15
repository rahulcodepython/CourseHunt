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
import { useBreadcrumbStore } from "@/store/breadcrumb.store";

export default function BreadcrumbComponent() {
    const items = useBreadcrumbStore((s) => s.items);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    {
                        items.length === 0 ? <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            : <BreadcrumbLink asChild>
                                <Link href="/">Dashboard</Link>
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
