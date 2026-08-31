"use client";

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import authClient from "@/lib/auth-client";
import useSession from "@/hooks/use-session";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardURI, ROUTES } from "@/lib/const";

const inputClass =
  "border-zinc-700 bg-zinc-800 text-white text-center text-lg tracking-[0.5em] placeholder:text-zinc-500 placeholder:tracking-normal focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30";

export default function TwoFactorPage() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const [code, setCode] = React.useState("");
  const [useBackupCode, setUseBackupCode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const finishLogin = async () => {
    const payload = await refreshSession();
    if (!payload?.user) {
      toast.error("Failed to load session after verification.");
      return;
    }
    const user = payload.user as typeof payload.user & { role?: string };
    router.push(getDashboardURI(user.role));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    try {
      const response = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.trim() });

      if (response.error) {
        toast.error(response.error.message || "Invalid code. Please try again.");
        return;
      }
      await finishLogin();
    } catch (error) {
      console.error("2FA verification failed:", error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Two-Factor Verification"
      subtitle={
        useBackupCode
          ? "Enter one of your saved backup codes"
          : "Enter the 6-digit code from your authenticator app"
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-zinc-300">
            {useBackupCode ? "Backup code" : "Authenticator code"}
          </Label>
          <Input
            id="code"
            inputMode={useBackupCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            placeholder={useBackupCode ? "xxxxxxxx" : "······"}
            maxLength={useBackupCode ? 16 : 6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
        <LoadingButton
          type="submit"
          loading={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500"
        >
          Verify &amp; Continue
        </LoadingButton>
      </form>

      <Button
        type="button"
        variant="link"
        className="mt-4 w-full text-zinc-400"
        onClick={() => {
          setUseBackupCode((v) => !v);
          setCode("");
        }}
      >
        {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
      </Button>

      <div className="mt-4 border-t border-zinc-800 pt-4 text-center">
        <Button
          type="button"
          variant="ghost"
          className="text-xs text-zinc-500"
          onClick={() => router.push(ROUTES.LOGIN)}
        >
          Back to login
        </Button>
      </div>
    </AuthCard>
  );
}
