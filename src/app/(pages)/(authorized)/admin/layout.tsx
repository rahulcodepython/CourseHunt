"use client"

import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbComponent from "@/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth.store";
import { NavbarDataType } from "@/types/navbar.type";
import {
    SquareTerminal
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const data: NavbarDataType = {
    navMain: [
        {
            title: "Admin Panel",
            children: [
                {
                    title: "Admin Panel",
                    url: "/admin",
                    icon: SquareTerminal,
                },
                {
                    title: "Courses",
                    url: "/admin/courses",
                },
                {
                    title: "Coupons",
                    url: "/admin/coupons",
                },
                {
                    title: "Feedbacks",
                    url: "/admin/feedback",
                },
                {
                    title: "Transactions",
                    url: "/admin/transactions",
                },
                {
                    title: "Users",
                    url: "/admin/users",
                },
                {
                    title: "User Dashboard",
                    url: "/user",
                },
            ]
        }
    ],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()

    const router = useRouter()

    if (!user) {
        router.push('/auth/login')
        return <></>
    }

    if (user.role !== 'admin') {
        router.push('/user')
        return <></>
    }

    return (
        <SidebarProvider>
            <AppSidebar data={data} />
            <main className="w-full min-h-screen">
                <header className="flex items-center justify-start gap-4 p-2">
                    <SidebarTrigger />
                    <BreadcrumbComponent />
                </header>
                <section className="p-8">
                    {children}
                </section>
            </main>
        </SidebarProvider>
    )
}