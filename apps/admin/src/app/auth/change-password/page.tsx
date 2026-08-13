"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useChangePasswordMutation } from "@/query-hooks/auth.api";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inputClass =
  "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const changePasswordMutation = useChangePasswordMutation();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current" className="text-zinc-300">
            Current Password
          </Label>
          <Input
            id="current"
            type="password"
            placeholder="Enter current password"
            {...register("currentPassword")}
            className={inputClass}
            autoComplete="current-password"
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new" className="text-zinc-300">
            New Password
          </Label>
          <Input
            id="new"
            type="password"
            placeholder="Minimum 8 characters"
            {...register("newPassword")}
            className={inputClass}
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-zinc-300">
            Confirm Password
          </Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Re-enter new password"
            {...register("confirmPassword")}
            className={inputClass}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          {isLoading && <Loader2 className="animate-spin size-4 mr-2" />}
          Change Password
        </Button>
      </form>
    </AuthCard>
  );
}
