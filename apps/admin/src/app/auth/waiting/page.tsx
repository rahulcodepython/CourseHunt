"use client";

import { Icon } from "@package/components/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { useSessionStore } from "@/stores/session-store";
import { signOut } from "@package/auth/auth-client";
import { Button } from "@package/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PermissionPendingPage() {
    const session = useSessionStore((s) => s.data);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
        toast.success("Logged out");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Icon name="IconClockHour1" className="w-8 h-8 text-amber-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Access Restricted</CardTitle>
                    <CardDescription className="text-zinc-400">
                        You do not have admin access to this portal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="IconUser" className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="text-zinc-300">{session?.user?.name || "User"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="IconMail" className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="text-zinc-300">{session?.user?.email || ""}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="IconShield" className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="text-zinc-400">Current role: <span className="text-amber-400 font-medium">User</span></span>
                        </div>
                    </div>

                    <div className="text-sm text-zinc-500 text-center space-y-2">
                        <p>If you believe you should have admin access, please contact the super administrator.</p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-200"
                        onClick={handleLogout}
                    >
                        <Icon name="IconLogout" className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
