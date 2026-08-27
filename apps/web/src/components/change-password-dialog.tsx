"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import authClient from "@/lib/auth-client";
import { downloadCredentialsCSV } from "@/lib/csv";
import { FormDialog } from "@/components/form-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";

const changePasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
});
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let out = "";
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

export function ChangePasswordDialog({
    open,
    onOpenChange,
    userId,
    userName,
    userEmail,
    role,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    userName?: string;
    userEmail?: string;
    role: string;
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { password: "" },
    });

    React.useEffect(() => {
        if (open) reset({ password: generatePassword() });
    }, [open, reset]);

    const onSubmit = async (data: ChangePasswordFormData) => {
        if (!userId) return;
        setIsSubmitting(true);
        try {
            const res = await authClient.admin.setUserPassword({ userId, newPassword: data.password });
            if (res.error) {
                toast.error(res.error.message || "Failed to change password");
                return;
            }
            toast.success("Password changed successfully! Credentials CSV downloaded.");
            downloadCredentialsCSV(
                { name: userName ?? "User", email: userEmail ?? "", password: data.password, role },
                typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
            );
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Change Password"
            description={userName ? `Set a new password for ${userName}. It will be downloaded as a CSV.` : "Set a new password."}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="new-password">New Password</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setValue("password", generatePassword())}>
                            <Icon name="refresh" className="size-3.5" />
                            Regenerate
                        </Button>
                    </div>
                    <PasswordInput id="new-password" autoComplete="new-password" {...register("password")} />
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <LoadingButton type="submit" loading={isSubmitting}>
                        Change Password
                    </LoadingButton>
                </DialogFooter>
            </form>
        </FormDialog>
    );
}
