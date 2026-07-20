"use client";

import { Icon } from "@/components/icon";
import { Button } from "@package/ui/button";
import { useTransactionStatusQuery } from "@package/query-hooks/transactions.api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PageState = "polling" | "success" | "failed" | "exhausted";

const STORAGE_PREFIX = "payment_attempts_";

export default function ConfirmationPage() {
    const { transactionId } = useParams();
    const txId = transactionId as string;
    const router = useRouter();

    const [pageState, setPageState] = useState<PageState>("polling");
    const [errorDescription, setErrorDescription] = useState<string | null>(null);
    const attemptsRef = useRef(0);

    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_PREFIX + txId);
        if (stored) {
            attemptsRef.current = parseInt(stored, 10);
            if (attemptsRef.current >= 7) {
                setPageState("exhausted");
            }
        }
    }, [txId]);

    const { data } = useTransactionStatusQuery(txId, {
        enabled: pageState === "polling",
        refetchInterval: pageState === "polling" ? 1000 : false,
    });

    useEffect(() => {
        if (!data?.data || pageState !== "polling") return;

        const txStatus = data.data.status;

        if (txStatus === "success") {
            sessionStorage.removeItem(STORAGE_PREFIX + txId);
            setPageState("success");
            return;
        }

        if (txStatus === "failed") {
            sessionStorage.removeItem(STORAGE_PREFIX + txId);
            setErrorDescription(data.data.error_description ?? null);
            setPageState("failed");
            return;
        }

        attemptsRef.current += 1;
        sessionStorage.setItem(STORAGE_PREFIX + txId, attemptsRef.current.toString());

        if (attemptsRef.current >= 7) {
            setPageState("exhausted");
        }
    }, [data, pageState, txId]);

    useEffect(() => {
        if (pageState !== "polling") return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [pageState]);

    if (pageState === "polling") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 max-w-md mx-auto p-8">
                    <Icon name="IconLoader2" className="h-16 w-16 animate-spin mx-auto text-primary" />
                    <h2 className="text-2xl font-bold">Confirming your payment...</h2>
                    <p className="text-muted-foreground">
                        Please wait while we verify your payment. Do not close or refresh this page.
                    </p>
                </div>
            </div>
        );
    }

    if (pageState === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 max-w-md mx-auto p-8">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <Icon name="IconCircleCheck" className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
                    <p className="text-muted-foreground">
                        You have been enrolled in the course successfully. Start learning now.
                    </p>
                    <Button
                        className="cursor-pointer"
                        onClick={() => router.push("/dashboard")}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (pageState === "failed") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 max-w-md mx-auto p-8">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <Icon name="IconCircleX" className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
                    {errorDescription && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{errorDescription}</p>
                    )}
                    <p className="text-muted-foreground">
                        Your payment could not be processed. Please try again.
                    </p>
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push("/courses")}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 max-w-md mx-auto p-8">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                    <Icon name="IconClock" className="h-10 w-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-700">Payment Processing</h2>
                <p className="text-muted-foreground">
                    Your payment is being processed. This may take a few moments. Please check back later.
                </p>
                <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
