"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/icon";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface NavSubItem {
    title: string;
    href: string;
    icon?: IconName;
    /** Backend permission string required to see/access this item; null/absent = no extra gate. */
    permission?: string | null;
}

export interface NavItem {
    title: string;
    icon: IconName;
    href?: string;
    children?: NavSubItem[];
    /** Backend permission string required to see/access this item; null/absent = no extra gate. */
    permission?: string | null;
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

interface BrandProps {
    title?: string;
    subTitle?: string;
    logo?: React.ReactNode;
}

function Brand({ title = "CourseHunt", subTitle = "Admin Panel", logo }: BrandProps) {
    return (
        <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                {logo ?? (
                    <svg viewBox="0 0 24 24" fill="none" className="size-4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                        <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />
                    </svg>
                )}
            </div>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold tracking-tight">{title}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {subTitle}
                </span>
            </div>
        </div>
    );
}

export interface AppSidebarProps {
    navGroups: NavGroup[];
    brandTitle?: string;
    brandSubTitle?: string;
    brandLogo?: React.ReactNode;
}

export function AppSidebar({
    navGroups,
    brandTitle,
    brandSubTitle,
    brandLogo,
}: AppSidebarProps) {
    const pathname = usePathname();

    const isLinkActive = (href?: string) => {
        if (!href) return false;
        return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <Brand title={brandTitle} subTitle={brandSubTitle} logo={brandLogo} />
            </SidebarHeader>
            <SidebarContent>
                {
                    navGroups.map((group) => <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarMenu>
                            {
                                group.items.map((item) => {
                                    const hasChildren = Boolean(item.children?.length);

                                    if (!hasChildren && item.href) {
                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <SidebarMenuButton asChild isActive={isLinkActive(item.href)} tooltip={item.title}>
                                                    <Link href={item.href}>
                                                        <Icon name={item.icon} className="size-4" />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    }

                                    const isAnyChildActive = item.children?.some((child) => isLinkActive(child.href));

                                    return (
                                        <Collapsible key={item.title} defaultOpen={isAnyChildActive} className="group/collapsible">
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        <Icon name={item.icon} className="size-4" />
                                                        <span>{item.title}</span>
                                                        <Icon name="chevron-right" className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {
                                                            item.children?.map((child) => <SidebarMenuSubItem key={child.href}>
                                                                <SidebarMenuSubButton asChild isActive={isLinkActive(child.href)}>
                                                                    <Link href={child.href}>
                                                                        {child.icon && <Icon name={child.icon} className="size-3.5" />}
                                                                        <span>{child.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                            )
                                                        }
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    );
                                })
                            }
                        </SidebarMenu>
                    </SidebarGroup>
                    )
                }
            </SidebarContent>
        </Sidebar>
    );
}
