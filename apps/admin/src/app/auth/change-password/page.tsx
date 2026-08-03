"use client";

import { useChangePasswordMutation } from "@package/query-hooks/auth.api";
import { AuthCard } from "@package/components/auth-card";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Icon } from "@package/components/icon";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

const inputClass =
  "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

export default function ChangePasswordPage() {
    const router = useRouter();
    const changePasswordMutation = useChangePasswordMutation();
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        try {
            const result = await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
            if (result?.error) {
                toast.error("Failed to change password");
                return;
            }
            toast.success("Password changed successfully.");
            router.push("/");
        } catch {
            toast.error("Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthCard
            title="Change Password"
            subtitle="You must change your password before continuing"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="current" className="text-zinc-300">
                        Current Password
                    </Label>
                    <Input
                        id="current"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClass}
                        autoComplete="current-password"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="new" className="text-zinc-300">
                        New Password
                    </Label>
                    <Input
                        id="new"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        autoComplete="new-password"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-zinc-300">
                        Confirm Password
                    </Label>
                    <Input
                        id="confirm"
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        autoComplete="new-password"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                >
                    {isLoading && <Icon name="IconLoader2" className="animate-spin" />}
                    Change Password
                </Button>
            </form>
        </AuthCard>
    );
}
