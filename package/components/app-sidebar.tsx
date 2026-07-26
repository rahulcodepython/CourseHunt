"use client";

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
import { Icon } from "@package/components/icon"
import { useSessionStore } from "@package/store/session.store"
import { signOut } from "@package/query-hooks/auth.api"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "sonner"

export interface NavItem {
  title: string
  url?: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  items?: NavItem[]
  children?: NavItem[]
}

export interface NavGroup {
  title: string
  children: NavItem[]
}

export interface AppSidebarProps {
  navMain: NavGroup[]
  branding: {
    icon: string
    title: string
    href?: string
  }
  profileHref?: string
}

export function AppSidebar({ navMain, branding, profileHref }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher icon={branding.icon} title={branding.title} href={branding.href} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser profileHref={profileHref} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavMain({ items }: { items: NavGroup[] }) {
  return (
    <SidebarContent>
      {items.map((item) => (
        <SidebarGroup key={item.title}>
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
          <SidebarMenu>
            {(item.children || []).map((child: NavItem) =>
              !child.items || child.items.length <= 0 ? (
                <SidebarMenuSubItem key={child.title} className="ml-4">
                  <SidebarMenuSubButton asChild>
                    <Link href={child.url || "#"}>
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ) : (
                <Collapsible
                  key={child.title}
                  asChild
                  defaultOpen={child.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild className="cursor-pointer">
                      <SidebarMenuButton tooltip={child.title}>
                        {child.icon && <child.icon />}
                        <span>{child.title}</span>
                        <Icon name="IconChevronRight" className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {(child.items || []).map((subItem: NavItem) => (
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
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarContent>
  )
}

function NavUser({ profileHref }: { profileHref?: string }) {
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
    user && (
      <SidebarMenu>
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
              {profileHref && (
                <>
                  <Link href={profileHref} className="w-full">
                    <DropdownMenuItem>
                      <Icon name="IconUser" className="mr-1" /> Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
                <Icon name="IconLogout" className="mr-1" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  )
}

function TeamSwitcher({ icon, title, href }: { icon: string; title: string; href?: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
          asChild
        >
          <Link href={href || "/"}>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Icon name={icon as any} className="size-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{title}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
