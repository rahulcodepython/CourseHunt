"use client";

import { Icon } from "@package/components/icon";
import { authClient, signInWithEmail } from "@package/auth/auth-client";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import React from "react";
import { toast } from "sonner";

export default function TutorLoginPage() {
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
    const [isEmailLoading, setIsEmailLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Failed to sign in with Google. Please try again.");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }
        setIsEmailLoading(true);
        try {
            const result = await signInWithEmail(email, password, "/");
            if (result.error) {
                toast.error(result.error.message || "Invalid credentials");
            }
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Failed to sign in. Please try again.");
        } finally {
            setIsEmailLoading(false);
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
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Tutor Portal</CardTitle>
                    <CardDescription className="text-zinc-400">Sign in to manage your courses and students</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 py-6">
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tutor@example.com"
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isEmailLoading}>
                            {isEmailLoading ? <Icon name="IconLoader" className="h-5 w-5 animate-spin" /> : "Sign in with Email"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-900/50 px-2 text-zinc-500 backdrop-blur-xl">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" disabled={isGoogleLoading} onClick={handleGoogleLogin}
                        className="w-full h-10 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                        {isGoogleLoading ? <Icon name="IconLoader" className="h-5 w-5 animate-spin" /> : (
                            <span className="flex items-center justify-center gap-4">
                                <Icon name="IconBrandGoogle" /> Sign in with Google
                            </span>
                        )}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-900/50 px-2 text-zinc-500 backdrop-blur-xl">Tutor Access Only</span>
                        </div>
                    </div>
                    <div className="text-center text-sm text-zinc-500">
                        Need a tutor account?{" "}
                        <span className="text-blue-400 font-medium">Contact administrator</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
