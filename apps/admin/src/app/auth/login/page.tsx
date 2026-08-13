"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthCard } from "@/components/auth-card";
import { useLoginWithEmailMutation, useLoginWithGoogleMutation } from "@/query-hooks/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSessionStore } from "@/store/session.store";

const inputClass =
    "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
    const loginEmailMutation = useLoginWithEmailMutation();
    const loginGoogleMutation = useLoginWithGoogleMutation();
    const router = useRouter();
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
    const [isEmailLoading, setIsEmailLoading] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            toast.error("Google SSO client logic needs ID token to proceed");
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Failed to sign in with Google. Please try again.");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const setSession = useSessionStore((s) => s.setSession);

    const handleEmailLogin = async (data: LoginFormData) => {
        setIsEmailLoading(true);
        try {
            const response = await loginEmailMutation.mutateAsync({ email: data.email, password: data.password });
            const user = response?.success && response?.data ? response.data.user : null;
            if (user) {
                setSession({ user, session: null });
            }
            router.push("/");
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Failed to sign in. Please try again.");
        } finally {
            setIsEmailLoading(false);
        }
    };

    return (
        <AuthCard
            title="Admin Portal"
            subtitle="Sign in to manage the platform"
        >
            <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-zinc-300">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        {...register("email")}
                        className={inputClass}
                        autoComplete="email"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-400">{errors.email.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-zinc-300">
                        Password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                        className={inputClass}
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <p className="text-xs text-red-400">{errors.password.message}</p>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={isEmailLoading || isGoogleLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                >
                    {isEmailLoading && <Loader2 className="animate-spin size-4 mr-2" />}
                    Sign in with Email
                </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
                <Separator className="flex-1 bg-zinc-800" />
                <span className="text-xs text-zinc-500">Or continue with</span>
                <Separator className="flex-1 bg-zinc-800" />
            </div>

            <Button
                type="button"
                variant="outline"
                disabled={isEmailLoading || isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full border-zinc-700 bg-zinc-800/60 text-white transition-transform hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] disabled:hover:scale-100"
            >
                {isGoogleLoading ? (
                    <Loader2 className="animate-spin size-4 mr-2" />
                ) : (
                    <svg viewBox="0 0 24 24" className="size-4 mr-2">
                        <path
                            fill="#4285F4"
                            d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.45a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.96-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.27v3.09A11.99 11.99 0 0 0 12 24z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.31 14.32a7.19 7.19 0 0 1 0-4.64V6.59H1.27a11.99 11.99 0 0 0 0 10.82l4.04-3.09z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 12 0 11.99 11.99 0 0 0 1.27 6.59l4.04 3.09C6.25 6.85 8.89 4.75 12 4.75z"
                        />
                    </svg>
                )}
                Sign in with Google
            </Button>

            <div className="mt-8 border-t border-zinc-800 pt-4 text-center">
                <p className="text-xs text-zinc-500">Admin Access Only</p>
                <p className="mt-1 text-xs text-zinc-600">
                    Contact super administrator for access
                </p>
            </div>
        </AuthCard>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
