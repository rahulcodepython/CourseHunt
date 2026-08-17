"use client";

import { useTransactionsQuery } from "@/query-hooks/transactions.api";
import type { Transaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default function StudentTransactionsPage() {
  const { data: raw, isLoading } = useTransactionsQuery();
  const transactions: Transaction[] = raw?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle="Your purchase history" />

      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Search transactions..."
        emptyIcon="currency-rupee"
        emptyText="You have not made any transactions yet."
        isLoading={isLoading}
        loadingText="Loading transactions..."
      />
    </div>
  );
}
