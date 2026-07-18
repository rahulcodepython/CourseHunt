"use client";

import { AppSidebar } from "@/components/app-sidebar"
import Loading from "@/components/loading";
import BreadcrumbComponent from "@/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@package/ui/sidebar";
import { useSession } from "@package/auth/auth-client";
import { NavbarDataType } from "@/types/navbar.type";
import { useRouter } from "next/navigation";
import React from "react";



export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession()
    const user = session?.user

    const router = useRouter()

    React.useEffect(() => {
        if (!isPending && !user) {
            router.push('/login')
        } else if (!isPending && user && user.role !== 'admin' && user.role !== 'tutor') {
            router.push('/dashboard')
        }
    }, [user, isPending, router])

    if (isPending) {
        return <Loading />
    }

    if (!user || (user.role !== 'admin' && user.role !== 'tutor')) {
        return null
    }

    const navItems = [
        { title: "Dashboard", url: "/adminpanel" },
        { title: "Courses", url: "/adminpanel/courses" },
        { title: "Feedback", url: "/adminpanel/feedback" },
    ];

    if (user.role === 'admin') {
        navItems.push(
            { title: "Coupons", url: "/adminpanel/coupons" },
            { title: "Transactions", url: "/adminpanel/transactions" },
            { title: "Users", url: "/adminpanel/users" }
        );
    }

    navItems.push({ title: "User Profile", url: "/dashboard" });

    const dynamicData: NavbarDataType = {
        navMain: [
            {
                title: user.role === 'tutor' ? "Tutor Panel" : "Admin Panel",
                children: navItems,
            }
        ]
    };

    return (
        <SidebarProvider>
            <AppSidebar data={dynamicData} />
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