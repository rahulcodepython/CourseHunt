"use client";

import { useChangePasswordMutation } from "@package/query-hooks/auth.api";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

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
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Change Password</CardTitle>
                    <CardDescription className="text-zinc-400">
                        You must change your password before continuing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
