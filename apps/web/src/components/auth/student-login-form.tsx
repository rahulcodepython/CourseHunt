"use client";

import React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import authClient from "@/lib/auth-client";
import useSession from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getDashboardURI } from "@/lib/const";

const inputClass =
    "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

const otpInputClass =
    "border-zinc-700 bg-zinc-800 text-white text-center text-lg tracking-[0.6em] placeholder:text-zinc-500 placeholder:tracking-normal focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StudentLoginForm() {
    const { refreshSession } = useSession();
    const router = useRouter();

    const [email, setEmail] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [step, setStep] = React.useState<"email" | "otp">("email");
    const [isSending, setIsSending] = React.useState(false);
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

    const busy = isSending || isVerifying || isGoogleLoading;

    const sendCode = async () => {
        if (!EMAIL_RE.test(email)) {
            toast.error("Enter a valid email address");
            return;
        }
        setIsSending(true);
        try {
            const response = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "sign-in",
            });
            if (response.error) {
                toast.error(response.error.message || "Failed to send code. Please try again.");
                return;
            }
            toast.success("Code sent — check your email");
            setStep("otp");
        } catch (error) {
            console.error("Send OTP failed:", error);
            toast.error("Failed to send code. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const finishLogin = async () => {
        const payload = await refreshSession();
        if (!payload?.user) {
            toast.error("Failed to load session after login.");
            return;
        }
        const user = payload.user as typeof payload.user & { role?: string };
        router.push(getDashboardURI(user.role));
    };

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.trim().length < 6) return;
        setIsVerifying(true);
        try {
            const response = await authClient.signIn.emailOtp({ email, otp: otp.trim() });
            if (response.error) {
                toast.error(response.error.message || "Invalid or expired code.");
                return;
            }
            // Accounts with TOTP enabled resolve with `{twoFactorRedirect: true}`
            // and no `user` — the client's twoFactorPage config is already
            // navigating the browser to /auth/two-factor, so just stop quietly.
            if (!response.data?.user) return;

            await finishLogin();
        } catch (error) {
            console.error("Verify OTP failed:", error);
            toast.error("Failed to verify code. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await authClient.signIn.social({ provider: "google", callbackURL: "/" });
        } catch (error) {
            console.error("Google login failed:", error);
            toast.error("Failed to sign in with Google. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {step === "email" ? (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="student-email" className="text-zinc-300">
                            Email
                        </Label>
                        <Input
                            id="student-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            autoComplete="email"
                            disabled={busy}
                        />
                    </div>
                    <LoadingButton
                        type="button"
                        loading={isSending}
                        disabled={busy}
                        onClick={sendCode}
                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                    >
                        Send code to email
                    </LoadingButton>
                </div>
            ) : (
                <form onSubmit={verifyCode} className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="student-otp" className="text-zinc-300">
                                Enter the 6-digit code
                            </Label>
                            <button
                                type="button"
                                className="text-xs text-zinc-500 hover:text-zinc-300"
                                onClick={() => {
                                    setStep("email");
                                    setOtp("");
                                }}
                                disabled={busy}
                            >
                                Change email
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500">Sent to {email}</p>
                        <Input
                            id="student-otp"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="······"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            className={otpInputClass}
                            disabled={busy}
                            autoFocus
                        />
                    </div>
                    <LoadingButton
                        type="submit"
                        loading={isVerifying}
                        disabled={busy || otp.length < 6}
                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                    >
                        Verify &amp; Sign in
                    </LoadingButton>
                    <Button
                        type="button"
                        variant="link"
                        className="w-full text-zinc-400"
                        disabled={busy}
                        onClick={sendCode}
                    >
                        Didn&apos;t get a code? Resend
                    </Button>
                </form>
            )}

            <div className="my-6 flex items-center gap-3">
                <Separator className="flex-1 bg-zinc-800" />
                <span className="text-xs text-zinc-500">Or continue with</span>
                <Separator className="flex-1 bg-zinc-800" />
            </div>

            <Button
                type="button"
                variant="outline"
                disabled={busy}
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

            <p className="mt-6 text-center text-xs text-zinc-500">
                New here? Signing in creates your student account instantly.
            </p>
        </div>
    );
}
