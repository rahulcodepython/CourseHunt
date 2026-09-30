"use client";
import * as React from "react";

import {
    useInfiniteTransactionsQuery,
    useInfiniteRefundsQuery,
    useAdminTransactionStatsQuery,
} from "@/query-hooks/transactions.api";
import type { Transaction, RefundTransaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/common/stat-card";
import { DataTable } from "@/components/table/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/utils/format";
import { columns } from "./columns";
import { refundColumns } from "./refund-columns";

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = React.useState<string>("all");

    const { data: stats } = useAdminTransactionStatsQuery();

    const {
        data: txData,
        isLoading: txLoading,
        fetchNextPage: fetchNextTx,
        hasNextPage: hasNextTx,
        isFetchingNextPage: isFetchingNextTx,
    } = useInfiniteTransactionsQuery({ limit: 12 }, "admin", {
        enabled: activeTab === "all",
    });

    const {
        data: refundsData,
        isLoading: refundsLoading,
        fetchNextPage: fetchNextRefunds,
        hasNextPage: hasNextRefunds,
        isFetchingNextPage: isFetchingNextRefunds,
    } = useInfiniteRefundsQuery({ limit: 12 }, {
        enabled: activeTab === "refunds",
    });

    const transactions: Transaction[] = React.useMemo(
        () => txData?.pages.flatMap((page) => page.data) ?? [],
        [txData],
    );
    const txTotalCount = txData?.pages[0]?.total ?? 0;

    const refunds: RefundTransaction[] = React.useMemo(
        () => refundsData?.pages.flatMap((page) => page.data) ?? [],
        [refundsData],
    );
    const refundsTotalCount = refundsData?.pages[0]?.total ?? 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transactions"
                subtitle="Revenue overview, transactions history, and refund management"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Net Revenue"
                    value={stats ? formatINR(stats.total_revenue) : "—"}
                    icon="currency-rupee"
                    iconClassName="text-green-600"
                />
                <StatCard
                    title="Total Refunded"
                    value={stats ? formatINR(stats.total_refunded) : "—"}
                    icon="arrow-back-up"
                    iconClassName="text-red-600"
                />
                <StatCard
                    title="Pending / Active Refunds"
                    value={stats ? stats.pending_refunds_count.toString() : "—"}
                    icon="receipt-refund"
                    iconClassName="text-amber-600"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Transactions</TabsTrigger>
                    <TabsTrigger value="refunds">Refunded & Duplicate Transactions</TabsTrigger>
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
                        onLoadMore={fetchNextTx}
                        hasNextPage={hasNextTx}
                        isFetchingNextPage={isFetchingNextTx}
                        totalCount={txTotalCount}
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
                        onLoadMore={fetchNextRefunds}
                        hasNextPage={hasNextRefunds}
                        isFetchingNextPage={isFetchingNextRefunds}
                        totalCount={refundsTotalCount}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
