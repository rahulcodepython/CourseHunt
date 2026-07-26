"use client";

import { AppSidebar as BaseSidebar, type NavGroup } from "@package/components/app-sidebar";

const adminNav: NavGroup[] = [
  {
    title: "Main",
    children: [
      { title: "Dashboard", url: "/" },
      { title: "Profile", url: "/profile" },
    ],
  },
  {
    title: "User Management",
    children: [
      { title: "Users", url: "/users" },
      { title: "Admins", url: "/admins" },
      { title: "Tutors", url: "/tutors" },
    ],
  },
  {
    title: "Content Management",
    children: [
      { title: "Courses", url: "/courses" },
      { title: "Categories", url: "/categories" },
      { title: "Feedback", url: "/feedback" },
    ],
  },
  {
    title: "Commerce",
    children: [
      { title: "Transactions", url: "/transactions" },
      { title: "Coupons", url: "/coupons" },
      { title: "Updates", url: "/updates" },
    ],
  },
  {
    title: "System",
    children: [
      { title: "Roles & Permissions", url: "/roles" },
      { title: "Security", url: "/security" },
      { title: "Monitoring", url: "/monitoring" },
      { title: "Logs", url: "/logs" },
      { title: "System Config", url: "/system-config" },
      { title: "Maintenance", url: "/maintenance" },
    ],
  },
];

export function AppSidebar() {
  return (
    <BaseSidebar
      navMain={adminNav}
      branding={{ icon: "IconShield", title: "Admin" }}
    />
  );
}

export type { NavGroup } from "@package/components/app-sidebar";
