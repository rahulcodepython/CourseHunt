"use client";

import { AppSidebar } from "@/components/app-sidebar"
import Loading from "@package/components/loading";
import BreadcrumbComponent from "@package/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@package/ui/sidebar";
import { useSession } from "@package/auth/auth-client";
import type { ComponentType } from "react";

interface NavGroupType {
    title: string;
    url?: string;
    icon?: ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: NavGroupType[];
    children?: NavGroupType[];
}

interface NavbarDataType {
    navMain: NavGroupType[];
}
import { useRouter } from "next/navigation";
import { useEffect } from "react";



export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession()
    const user = session?.user

    const router = useRouter()

    const userRole = (user as { id: string; name: string; email: string; image?: string | null; role?: string })?.role;

    useEffect(() => {
        if (!isPending && !user) {
            router.push('/login')
        } else if (!isPending && user && userRole !== 'admin' && userRole !== 'tutor') {
            router.push('/dashboard')
        }
    }, [user, userRole, isPending, router])

    if (isPending) {
        return <Loading />
    }

    if (!user || (userRole !== 'admin' && userRole !== 'tutor')) {
        return null
    }

    const navItems = [
        { title: "Dashboard", url: "/adminpanel" },
        { title: "Courses", url: "/adminpanel/courses" },
        { title: "Feedback", url: "/adminpanel/feedback" },
    ];

    if (userRole === 'admin') {
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
                title: userRole === 'tutor' ? "Tutor Panel" : "Admin Panel",
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