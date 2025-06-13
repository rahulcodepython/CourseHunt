"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavbarDataType } from "@/types/navbar.type";
import {
    SquareTerminal
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const data: NavbarDataType = {
        user: {
            name: "shadcn",
            email: "m@example.com",
            avatar: "/avatars/shadcn.jpg",
        },
        navMain: [
            {
                title: "Platform",
                children: [
                    {
                        title: "Course",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Courses",
                                url: "/admin/courses",
                            },
                            {
                                title: "Course Edit",
                                url: "/admin/courses/edit",
                            },
                        ],
                    },
                    {
                        title: "Coupon",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Coupons",
                                url: "/admin/coupons",
                            },
                        ],
                    },
                    {
                        title: "Feedback",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Feedback",
                                url: "/admin/feedback",
                            },
                        ],
                    },
                    {
                        title: "Transaction",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Transactions",
                                url: "/admin/transactions",
                            },
                        ],
                    },
                    {
                        title: "User",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Users",
                                url: "/admin/users",
                            },
                        ],
                    },
                ]
            }
        ],
    };
    return (
        <SidebarProvider>
            <AppSidebar data={data} />
            <main className="w-full min-h-screen">
                <header className="flex items-center justify-start gap-4 p-2">
                    <SidebarTrigger />
                    <h1>Admin Dashboard</h1>
                </header>
                <section className="p-8">
                    {children}
                </section>
            </main>
        </SidebarProvider>
    )
}