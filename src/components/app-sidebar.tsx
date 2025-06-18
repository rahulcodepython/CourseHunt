"use client"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
import {
    ChevronRight,
    LogOut,
    MountainIcon
} from "lucide-react"

import { logout } from "@/api/logout.api"
import {
    Avatar,
    AvatarFallback
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useApiHandler } from "@/hooks/useApiHandler"
import { useAuthStore } from "@/store/auth.store"
import { NavbarDataType, NavGroupType } from "@/types/navbar.type"
import {
    User
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
                                item.children.map((item) => (
                                    !item.items || item.items.length <= 0 ? <SidebarMenuSubItem key={item.title} className="ml-4">
                                        <SidebarMenuSubButton asChild>
                                            <Link href={item.url}>
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
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items?.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild>
                                                                    <Link href={subItem.url}>
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
    const { user } = useAuthStore()

    const { isLoading, callApi } = useApiHandler()

    const router = useRouter()

    const handleLogout = async () => {
        const response = await callApi(logout)

        if (response) {
            router.push("/auth/login")
            toast.success(response.message || "Logged out successfully")
        }
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="">
                                CV
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-start flex flex-col">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="mt-2 w-72">
                        <DropdownMenuItem className="py-3">
                            <Avatar>
                                <AvatarFallback className="">
                                    CV
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-1 flex flex-col">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Link href="/user/profile">
                                <User className="mr-1" /> Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={isLoading} onClick={handleLogout}>
                            <LogOut className="mr-1" /> Log out
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                            asChild
                        >
                            <Link href="/">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <MountainIcon className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">CourseHunt</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
