"use client";
import * as React from "react";

import { useTransactionsQuery, useRefundsQuery } from "@/query-hooks/transactions.api";
import type { Transaction, RefundTransaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/format";
import { columns } from "./columns";
import { refundColumns } from "./refund-columns";

export default function TransactionsPage() {
    const { data: rawTx, isLoading: txLoading } = useTransactionsQuery(undefined, "admin");
    const { data: rawRefunds, isLoading: refundsLoading } = useRefundsQuery();

    const transactions: Transaction[] = (rawTx?.data?.data as any) ?? [];
    const refunds: RefundTransaction[] = (rawRefunds?.data?.data as any) ?? [];

    const totalRevenue = transactions
        .filter((t) => t.status === "confirmed" || t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalRefundedAmount = refunds
        .filter((r) => r.refund_status === "processed" || r.refund_status === "refunded")
        .reduce((sum, r) => sum + (r.amount || 0), 0);

    const pendingRefundsCount = refunds.filter((r) => r.refund_status === "pending").length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transactions"
                subtitle="Revenue overview, transactions history, and refund management"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Net Revenue"
                    value={formatINR(totalRevenue)}
                    icon="currency-rupee"
                    iconClassName="text-green-600"
                />
                <StatCard
                    title="Total Refunded"
                    value={formatINR(totalRefundedAmount)}
                    icon="arrow-back-up"
                    iconClassName="text-red-600"
                />
                <StatCard
                    title="Pending / Active Refunds"
                    value={pendingRefundsCount.toString()}
                    icon="receipt-refund"
                    iconClassName="text-amber-600"
                />
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Transactions ({transactions.length})</TabsTrigger>
                    <TabsTrigger value="refunds">Refunded & Duplicate Transactions ({refunds.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <DataTable
                        columns={columns}
                        data={transactions}
                        searchPlaceholder="Search transactions..."
                        emptyIcon="currency-rupee"
                        emptyText="No transactions found"
                        isLoading={txLoading}
                        loadingText="Loading transactions..."
                    />
                </TabsContent>

                <TabsContent value="refunds" className="space-y-4">
                    <DataTable
                        columns={refundColumns}
                        data={refunds}
                        searchPlaceholder="Search refunds & duplicate transactions..."
                        emptyIcon="receipt-refund"
                        emptyText="No refunded or duplicate transactions found"
                        isLoading={refundsLoading}
                        loadingText="Loading refund transactions..."
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
