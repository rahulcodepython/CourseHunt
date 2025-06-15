"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

function BreadcrumbComponent() {
    const pathname = usePathname()
    const pathParts = pathname.split("/").filter(Boolean)

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathParts.map((part, index) => {
                    const href = `/${pathParts.slice(0, index + 1).join("/")}`
                    return (
                        <React.Fragment key={index}>
                            <BreadcrumbItem>
                                <Link href={href}>
                                    {part.charAt(0).toUpperCase() + part.slice(1)}
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="last:hidden" />
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default BreadcrumbComponent