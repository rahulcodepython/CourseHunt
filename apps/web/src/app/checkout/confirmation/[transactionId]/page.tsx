"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useTransactionStatusQuery } from "@/query-hooks/transactions.api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { ROUTES } from "@/lib/const";

const MAX_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 1500;

export default function PaymentConfirmationPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [attempts, setAttempts] = React.useState(0);

  const { data: raw } = useTransactionStatusQuery(transactionId, {
    enabled: !!transactionId,
    refetchInterval: POLL_INTERVAL_MS,
  });
  const status = raw?.data?.status;
  const resolved = status === "success" || status === "failed";
  const exhausted = !resolved && attempts >= MAX_ATTEMPTS;

  React.useEffect(() => {
    if (resolved || exhausted) return;
    const timer = setTimeout(() => setAttempts((a) => a + 1), POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [resolved, exhausted, attempts]);

  const view: "polling" | "success" | "failed" | "exhausted" = resolved
    ? (status as "success" | "failed")
    : exhausted
      ? "exhausted"
      : "polling";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      {view === "polling" && (
        <>
          <Icon name="refresh" className="size-16 animate-spin text-primary" />
          <h1 className="text-xl font-semibold">Confirming your payment...</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Please don&apos;t close this page while we confirm your payment with Razorpay.
          </p>
        </>
      )}

      {view === "success" && (
        <>
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
            <Icon name="check" className="size-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-green-600">Payment Successful!</h1>
          <p className="text-sm text-muted-foreground">You&apos;re now enrolled in the course.</p>
          <Button asChild>
            <Link href={ROUTES.STUDENT_DASHBOARD}>Go to Dashboard</Link>
          </Button>
        </>
      )}

      {view === "failed" && (
        <>
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
            <Icon name="x" className="size-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-red-600">Payment Failed</h1>
          {raw?.data?.error_description && (
            <p className="max-w-sm rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {raw.data.error_description}
            </p>
          )}
          <Button asChild>
            <Link href="/courses">Try Again</Link>
          </Button>
        </>
      )}

      {view === "exhausted" && (
        <>
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
            <Icon name="clock" className="size-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold">Payment Processing</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            This is taking longer than expected. We&apos;ll update your enrollment as soon as the
            payment confirms.
          </p>
          <Button asChild>
            <Link href={ROUTES.STUDENT_DASHBOARD}>Go to Dashboard</Link>
          </Button>
        </>
      )}
    </div>
  );
}
