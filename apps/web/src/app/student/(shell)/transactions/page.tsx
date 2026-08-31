"use client";

import { useTransactionsQuery, useMyRefundsQuery } from "@/query-hooks/transactions.api";
import type { Transaction, RefundTransaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "./columns";
import { refundColumns } from "./refund-columns";

export default function StudentTransactionsPage() {
  const { data: rawTx, isLoading: txLoading } = useTransactionsQuery();
  const { data: rawRefunds, isLoading: refundsLoading } = useMyRefundsQuery();

  const transactions: Transaction[] = rawTx?.data?.data ?? [];
  const refunds: RefundTransaction[] = rawRefunds?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle="Your purchase and refund history" />

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Purchase History ({transactions.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds & Duplicates ({refunds.length})</TabsTrigger>
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
