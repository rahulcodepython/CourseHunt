"use client";

import { Icon } from "@package/components/icon";


import { authClient } from "@package/auth/auth-client";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";

import React from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Failed to sign in with Google. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Login to your account to continue your learning journey
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 py-6">
                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                        className="w-full h-10 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {
                            isLoading ? <Icon name="IconLoader" className="h-5 w-5 animate-spin" /> : <span className="flex items-center justify-center gap-4">
                                <Icon name="IconBrandGoogle" />
                                Sign in with Google
                            </span>
                        }
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
