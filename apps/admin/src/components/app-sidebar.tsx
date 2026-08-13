"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Icon, type IconName } from "@/components/icon";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/store/session.store";

export interface NavSubItem {
  title: string;
  href: string;
  icon?: IconName;
}

export interface NavItem {
  title: string;
  icon: IconName;
  href?: string;
  children?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const defaultNavGroups: NavGroup[] = [
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
      {
        title: "Courses & Content",
        icon: "category",
        children: [
          { title: "All Courses", href: "/courses", icon: "category" },
          { title: "Categories", href: "/categories", icon: "folder" },
        ],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Billing & Sales",
        icon: "currency-rupee",
        children: [
          { title: "Transactions", href: "/transactions", icon: "currency-rupee" },
          { title: "Coupons", href: "/coupons", icon: "ticket" },
        ],
      },
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-4.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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

function SidebarUser() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    document.cookie = "ch_token=; path=/; max-age=0";
    clearSession();
    toast.success("Signed out");
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none">
          <Avatar className="size-8 border">
            {user?.image ? <AvatarImage src={user.image} /> : null}
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">
              {user?.name ?? "Admin"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{user?.name ?? "Admin"}</span>
          <span className="text-xs font-normal text-muted-foreground">
            Platform Administrator
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <Icon name="user" className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <Icon name="logout" className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface AppSidebarProps {
  navGroups?: NavGroup[];
  brandTitle?: string;
  brandSubTitle?: string;
  brandLogo?: React.ReactNode;
}

export function AppSidebar({
  navGroups = defaultNavGroups,
  brandTitle,
  brandSubTitle,
  brandLogo,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Brand title={brandTitle} subTitle={brandSubTitle} logo={brandLogo} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;

                if (!hasChildren && item.href) {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <Icon name={item.icon} className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isAnyChildActive = item.children?.some(
                  (child) =>
                    pathname === child.href ||
                    pathname.startsWith(child.href + "/"),
                );

                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isAnyChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <Icon name={item.icon} className="size-4" />
                          <span>{item.title}</span>
                          <Icon
                            name="chevron-right"
                            className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children?.map((child) => {
                            const isChildActive =
                              pathname === child.href ||
                              pathname.startsWith(child.href + "/");
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isChildActive}
                                >
                                  <Link href={child.href}>
                                    {child.icon && (
                                      <Icon
                                        name={child.icon}
                                        className="size-3.5"
                                      />
                                    )}
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
