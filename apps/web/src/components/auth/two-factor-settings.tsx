"use client";

import React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

import authClient from "@/lib/auth-client";
import useSession from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";

type Step = "idle" | "enrolling" | "confirming";

export function TwoFactorSettings() {
    const { refreshSession, user } = useSession();
    const enabled = Boolean((user as { twoFactorEnabled?: boolean } | null)?.twoFactorEnabled);

    const [step, setStep] = React.useState<Step>("idle");
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
    const [code, setCode] = React.useState("");
    const [isBusy, setIsBusy] = React.useState(false);

    const startEnroll = async () => {
        setIsBusy(true);
        try {
            const response = await authClient.twoFactor.enable({ issuer: "CourseHunt" });
            if (response.error || !response.data) {
                toast.error(response.error?.message || "Failed to start setup.");
                return;
            }
            if (!("totpURI" in response.data)) {
                toast.error("Invalid 2FA method returned.");
                return;
            }
            const dataUrl = await QRCode.toDataURL(response.data.totpURI);
            setQrDataUrl(dataUrl);
            setBackupCodes(response.data.backupCodes);
            setStep("confirming");
        } catch {
            toast.error("Failed to start two-factor setup.");
        } finally {
            setIsBusy(false);
        }
    };

    const confirmEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim().length < 6) return;
        setIsBusy(true);
        try {
            const response = await authClient.twoFactor.verifyTotp({ code: code.trim() });
            if (response.error) {
                toast.error(response.error.message || "Invalid code. Please try again.");
                return;
            }
            toast.success("Two-factor authentication enabled");
            setStep("idle");
            setCode("");
            setQrDataUrl(null);
            await refreshSession();
        } catch {
            toast.error("Failed to verify code.");
        } finally {
            setIsBusy(false);
        }
    };

    const disable = async () => {
        setIsBusy(true);
        try {
            const response = await authClient.twoFactor.disable({});
            if (response.error) {
                toast.error(response.error.message || "Failed to disable two-factor authentication.");
                return;
            }
            toast.success("Two-factor authentication disabled");
            await refreshSession();
        } catch {
            toast.error("Failed to disable two-factor authentication.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Add an authenticator app (Google Authenticator, Authy, etc.) as a second
                    verification step whenever you sign in with your email or Google.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === "idle" && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon
                                name={enabled ? "shield-check" : "shield"}
                                className={enabled ? "size-4 text-emerald-500" : "size-4 text-muted-foreground"}
                            />
                            <span className="text-sm font-medium">
                                {enabled ? "Enabled" : "Not enabled"}
                            </span>
                        </div>
                        {enabled ? (
                            <Button variant="destructive" onClick={disable} disabled={isBusy}>
                                Disable
                            </Button>
                        ) : (
                            <LoadingButton onClick={startEnroll} loading={isBusy}>
                                Enable two-factor
                            </LoadingButton>
                        )}
                    </div>
                )}

                {step === "confirming" && qrDataUrl && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrDataUrl} alt="TOTP QR code" className="size-48" />
                            <p className="text-center text-xs text-muted-foreground">
                                Scan this with your authenticator app, then enter the 6-digit code it
                                shows below.
                            </p>
                        </div>

                        {backupCodes.length > 0 && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                                <p className="mb-2 text-xs font-medium text-amber-600">
                                    Save these backup codes — each can be used once if you lose your
                                    device. They won&apos;t be shown again.
                                </p>
                                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                                    {backupCodes.map((c) => (
                                        <span key={c}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={confirmEnroll} className="flex items-end gap-2">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="totp-confirm">Verification code</Label>
                                <Input
                                    id="totp-confirm"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="······"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                    autoFocus
                                />
                            </div>
                            <LoadingButton type="submit" loading={isBusy} disabled={code.length < 6}>
                                Confirm
                            </LoadingButton>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setStep("idle");
                                    setQrDataUrl(null);
                                    setCode("");
                                }}
                                disabled={isBusy}
                            >
                                Cancel
                            </Button>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
