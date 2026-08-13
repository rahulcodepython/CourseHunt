"use client";

import * as React from "react";
import { useTransactionsQuery } from "@/query-hooks/transactions.api";
import type { Transaction } from "@/schema/transactions.types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { formatINR } from "@/lib/format";
import { columns } from "./columns";

export default function TransactionsPage() {
  const { data: raw, isLoading } = useTransactionsQuery();
  const transactions: Transaction[] = (raw?.data?.data as any) ?? [];

  const totalRevenue = transactions
    .filter((t) => t.status === "confirmed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalRefunds = transactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const refundsCount = transactions.filter((t) => t.status === "refunded").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Revenue overview and complete transaction history"
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
          value={formatINR(totalRefunds)}
          icon="arrow-back-up"
          iconClassName="text-red-600"
        />
        <StatCard
          title="Refund Requests"
          value={refundsCount.toString()}
          icon="receipt-refund"
        />
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Search transactions..."
        emptyIcon="currency-rupee"
        emptyText={isLoading ? "Loading transactions..." : "No transactions found"}
      />
    </div>
  );
}
