"use client";

import { Loader2 } from "lucide-react";
import useSession from "@/hooks/use-session";
import { getDashboardURI } from "@/lib/const";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const { user, isPending, signOut } = useSession();

    if (isPending) {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    // Authenticated user with no dedicated dashboard (e.g. a regular user) lands here.
    if (user && getDashboardURI(user.role) === "/") {
        return (
            <div className="flex min-h-dvh items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
                    <Loader2 className="mx-auto size-8 text-muted-foreground" />
                    <h1 className="mt-4 text-lg font-semibold">No dashboard access</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your account doesn&apos;t have access to an administration or tutor dashboard.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-6"
                        onClick={() => signOut()}
                    >
                        Sign out
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}