"use client";

import { Icon } from "@package/components/icon";


import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@package/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar
} from "@package/ui/sidebar"


import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@package/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@package/ui/dropdown-menu"
import { useSessionStore } from "@/stores/session-store";
import { signOut } from "@package/auth/auth-client"

interface NavGroupType {
    title: string;
    url?: string;
    icon?: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: NavGroupType[];
    children?: NavGroupType[];
}

interface NavbarDataType {
    navMain: NavGroupType[];
}

import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "sonner"

export function AppSidebar({ data }: { data: NavbarDataType }) {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <TeamSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export function NavMain({ items }: { items: NavGroupType[] }) {
    return (
        <SidebarContent>
            {
                items.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>
                            {item.title}
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {
                                (item.children || []).map((item: NavGroupType) => (
                                    !item.items || item.items.length <= 0 ? <SidebarMenuSubItem key={item.title} className="ml-4">
                                        <SidebarMenuSubButton asChild>
                                            <Link href={item.url || "#"}>
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem> :
                                        <Collapsible
                                            key={item.title}
                                            asChild
                                            defaultOpen={item.isActive}
                                            className="group/collapsible"
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild className="cursor-pointer">
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <Icon name="IconChevronRight" className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {(item.items || []).map((subItem: NavGroupType) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild>
                                                                    <Link href={subItem.url || "#"}>
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                ))
                            }
                        </SidebarMenu>
                    </SidebarGroup>
                ))
            }

        </SidebarContent>
    )
}

export function NavUser() {
    const { isMobile } = useSidebar()
    const session = useSessionStore((s) => s.data)
    const user = session?.user

    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await signOut()
            router.push("/login")
            toast.success("Logged out successfully")
        } catch {
            toast.error("Failed to log out")
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        user && <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.image || undefined} alt={user.name} className="rounded-full" />
                                <AvatarFallback className="rounded-lg">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.image || undefined} alt={user.name} className="rounded-full" />
                                        <AvatarFallback className="rounded-lg">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user.name}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <Link href="/dashboard/profile" className="w-full">
                            <DropdownMenuItem>
                                <Icon name="IconUser" className="mr-1" /> Profile
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
                            <Icon name="IconLogout" className="mr-1" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export function TeamSwitcher() {

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                    asChild
                >
                    <Link href="/">
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Icon name="IconMountain" className="size-5" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">CourseHunt</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
