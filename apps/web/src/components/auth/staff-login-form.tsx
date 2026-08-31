"use client";

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import authClient from "@/lib/auth-client";
import useSession from "@/hooks/use-session";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { ROUTES, ROLES, getDashboardURI } from "@/lib/const";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inputClass =
  "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function StaffLoginForm() {
  const { refreshSession } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleEmailLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (response.error || !response.data) {
        toast.error(response.error?.message || "Failed to sign in. Please check credentials.");
        return;
      }

      // Accounts with TOTP enabled get `{twoFactorRedirect: true}` here
      // with no `user` — the client's twoFactorPage config is already
      // navigating the browser away, so just stop quietly.
      if (!response.data.user) return;

      const user = response.data.user as typeof response.data.user & {
        passwordChangedAt?: string | null;
      };
      const mustChangePassword =
        (user.role === ROLES.ADMIN || user.role === ROLES.TUTOR) && !user.passwordChangedAt;

      const payload = await refreshSession();
      if (!payload?.user) {
        toast.error("Failed to load session after login.");
        return;
      }

      router.push(mustChangePassword ? ROUTES.CHANGE_PASSWORD : getDashboardURI(user.role));
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Failed to sign in. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="staff-email" className="text-zinc-300">
          Email
        </Label>
        <Input
          id="staff-email"
          type="email"
          placeholder="you@coursehunt.com"
          {...register("email")}
          className={inputClass}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="staff-password" className="text-zinc-300">
          Password
        </Label>
        <PasswordInput
          id="staff-password"
          placeholder="••••••••"
          {...register("password")}
          className={inputClass}
          autoComplete="current-password"
        />
        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
      </div>
      <LoadingButton
        type="submit"
        loading={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-500"
      >
        Sign in
      </LoadingButton>
      <p className="text-center text-xs text-zinc-500">
        Staff accounts (admin/tutor) are provisioned by an administrator. Contact your administrator
        if you need access.
      </p>
    </form>
  );
}
