"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@package/ui/collapsible";
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
  SidebarSeparator,
  useSidebar,
} from "@package/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@package/ui/dropdown-menu";
import { Icon } from "@package/components/icon";
import { useSessionStore } from "@package/store/session.store";
import { signOut } from "@package/query-hooks/auth.api";

export interface NavItem {
  title: string;
  url?: string;
  href?: string;
  icon?: string | React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  items?: NavItem[];
  children?: NavItem[];
}

export interface NavGroup {
  title?: string;
  label?: string;
  children?: NavItem[];
  items?: NavItem[];
}

export interface AppSidebarProps {
  navMain?: NavGroup[];
  branding?: {
    icon: string;
    title: string;
    href?: string;
  };
  profileHref?: string;
}

const defaultAdminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: "dashboard" }],
  },
  {
    label: "Management",
    items: [
      { title: "Users", href: "/users", icon: "users" },
      { title: "Admins", href: "/admins", icon: "user-check" },
      { title: "Tutors", href: "/tutors", icon: "book" },
      { title: "Courses", href: "/courses", icon: "category" },
      { title: "Categories", href: "/categories", icon: "folder" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Transactions", href: "/transactions", icon: "currency-rupee" },
      { title: "Coupons", href: "/coupons", icon: "ticket" },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Feedback", href: "/feedback", icon: "message" },
      { title: "Discussions", href: "/discussions/ch_001_lsn_1", icon: "messages" },
    ],
  },
  {
    label: "Access Control",
    items: [
      { title: "Roles & Permissions", href: "/roles", icon: "shield" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Security", href: "/security", icon: "lock" },
      { title: "Monitoring", href: "/monitoring", icon: "activity" },
      { title: "Logs", href: "/logs", icon: "file-text" },
      { title: "System Config", href: "/system-config", icon: "settings" },
      { title: "Maintenance", href: "/maintenance", icon: "clock" },
      { title: "Updates", href: "/updates", icon: "world" },
    ],
  },
];

export function AppSidebar({ navMain, branding, profileHref }: AppSidebarProps) {
  const pathname = usePathname();
  const groups = navMain || defaultAdminNavGroups;
  const brand = branding || { icon: "dashboard", title: "CourseHunt", href: "/" };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher icon={brand.icon} title={brand.title} href={brand.href} />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {groups.map((group, idx) => {
          const groupTitle = group.label || group.title || "";
          const groupItems = group.items || group.children || [];
          return (
            <SidebarGroup key={groupTitle || idx}>
              {groupTitle && <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>}
              <SidebarMenu>
                {groupItems.map((item) => {
                  const targetUrl = item.href || item.url || "#";
                  const isActive =
                    targetUrl === "/"
                      ? pathname === "/"
                      : pathname === targetUrl || pathname.startsWith(targetUrl + "/");

                  if (item.children && item.children.length > 0) {
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild className="cursor-pointer">
                            <SidebarMenuButton tooltip={item.title}>
                              {typeof item.icon === "string" ? (
                                <Icon name={item.icon} className="size-4" />
                              ) : item.icon ? (
                                <item.icon />
                              ) : null}
                              <span>{item.title}</span>
                              <Icon
                                name="IconChevronRight"
                                className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link href={subItem.href || subItem.url || "#"}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={targetUrl + item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={targetUrl}>
                          {typeof item.icon === "string" ? (
                            <Icon name={item.icon} className="size-4" />
                          ) : item.icon ? (
                            <item.icon />
                          ) : null}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <NavUser profileHref={profileHref || "/profile"} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavUser({ profileHref }: { profileHref?: string }) {
  const { isMobile } = useSidebar();
  const session = useSessionStore((s) => s.data);
  const clearSession = useSessionStore((s) => s.clearSession);
  const user = session?.user;

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearSession();
      document.cookie = "ch_token=; path=/; max-age=0";
      router.push("/auth/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    user && (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-lg border">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary/10 rounded-lg text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
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
                      {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={profileHref || "/profile"} className="cursor-pointer flex items-center w-full" />}>
                <Icon name="IconUser" className="mr-1 size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <Icon name="IconLogout" className="mr-1 size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  );
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
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-xs">
              <Icon name={icon} className="size-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold tracking-tight">{title}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Admin Panel
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
