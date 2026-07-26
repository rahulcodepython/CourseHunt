"use client";

import { AppSidebar as BaseSidebar, type NavGroup } from "@package/components/app-sidebar";

const tutorNav: NavGroup[] = [
  {
    title: "Tutor Panel",
    children: [
      { title: "Dashboard", url: "/" },
      { title: "Courses", url: "/courses" },
      { title: "Feedbacks", url: "/feedbacks" },
      { title: "Discussions", url: "/discussions" },
      { title: "Enrolled Students", url: "/enrolled-students" },
      { title: "Profile", url: "/profile" },
    ],
  },
];

export function AppSidebar() {
  return (
    <BaseSidebar
      navMain={tutorNav}
      branding={{ icon: "IconMountain", title: "CourseHunt" }}
    />
  );
}

export type { NavGroup } from "@package/components/app-sidebar";
