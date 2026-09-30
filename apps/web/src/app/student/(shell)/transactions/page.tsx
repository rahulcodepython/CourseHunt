"use client";

import * as React from "react";
import { useInfiniteTransactionsQuery, useInfiniteMyRefundsQuery } from "@/query-hooks/transactions.api";
import type { Transaction, RefundTransaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "./columns";
import { refundColumns } from "./refund-columns";

export default function StudentTransactionsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("purchases");

  const {
    data: txData,
    isLoading: txLoading,
    fetchNextPage: fetchNextTx,
    hasNextPage: hasNextTx,
    isFetchingNextPage: isFetchingNextTx,
  } = useInfiniteTransactionsQuery({ limit: 12 }, "student", {
    enabled: activeTab === "purchases",
  });

  const {
    data: refundsData,
    isLoading: refundsLoading,
    fetchNextPage: fetchNextRefunds,
    hasNextPage: hasNextRefunds,
    isFetchingNextPage: isFetchingNextRefunds,
  } = useInfiniteMyRefundsQuery({ limit: 12 }, {
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
      <PageHeader title="Transactions" subtitle="Your purchase and refund history" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">
            Purchase History {txData ? `(${txTotalCount || transactions.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="refunds">
            Refunds & Duplicates {refundsData ? `(${refundsTotalCount || refunds.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <DataTable
            columns={columns}
            data={transactions}
            searchPlaceholder="Search transactions..."
            emptyIcon="currency-rupee"
            emptyText="You have not made any transactions yet."
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
            searchPlaceholder="Search refunds..."
            emptyIcon="receipt-refund"
            emptyText="You have no refunded or duplicate transactions."
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
