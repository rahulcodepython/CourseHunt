"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useTransactionsQuery } from "@package/query-hooks/transactions.api";
import type { Transaction } from "@package/schema/transactions.types";
import { PageHeader } from "@package/components/page-header";
import { StatCard } from "@package/components/stat-card";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { formatDateTime, formatINR, truncate } from "@package/lib/format";

export default function TransactionsPage() {
	const { data: raw, isLoading } = useTransactionsQuery();
	const transactions: Transaction[] = raw?.data?.data ?? [];

	if (isLoading || !raw?.data) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Transactions"
					subtitle="Revenue overview and complete transaction history"
				/>
				<Loading />
			</div>
		);
	}

	const totalRevenue = transactions
		.filter((t) => t.status === "confirmed")
		.reduce((sum, t) => sum + (t.amount || 0), 0);

	const totalRefunds = transactions
		.filter((t) => t.status === "refunded")
		.reduce((sum, t) => sum + (t.amount || 0), 0);

	const refundsCount = transactions.filter((t) => t.status === "refunded").length;

	const columns: DataTableColumn<Transaction>[] = [
		{
			header: "Transaction ID",
			render: (t) => (
				<span className="font-mono text-xs">{truncate(t.id, 14)}</span>
			),
		},
		{
			header: "Date",
			render: (t) => (
				<span className="text-muted-foreground">{formatDateTime(t.created_at)}</span>
			),
		},
		{
			header: "User",
			render: (t) => <span className="font-medium">{t.user.name}</span>,
		},
		{
			header: "Course",
			render: (t) => (
				<span className="text-muted-foreground">{t.course?.title ?? "—"}</span>
			),
		},
		{
			header: "Amount",
			render: (t) => (
				<span className="font-medium tabular-nums">{formatINR(t.amount || 0)}</span>
			),
			className: "text-right",
			headerClassName: "text-right",
		},
		{
			header: "Status",
			render: (t) => (
				<Badge
					variant={t.status === "refunded" ? "destructive" : "outline"}
					className={
						t.status === "confirmed"
							? "border-transparent bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
							: t.status === "refunded"
								? ""
								: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400"
					}
				>
					{t.status}
				</Badge>
			),
		},
	];

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
					icon="IconCurrencyRupee"
					iconClassName="text-green-600"
				/>
				<StatCard
					title="Total Refunded"
					value={formatINR(totalRefunds)}
					icon="IconArrowBackUp"
					iconClassName="text-red-600"
				/>
				<StatCard
					title="Refund Requests"
					value={refundsCount.toString()}
					icon="IconReceiptRefund"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transaction History</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						columns={columns}
						data={transactions}
						keyExtractor={(t) => t.id}
						isLoading={false}
						page={1}
						totalPages={1}
						total={transactions.length}
						pageSize={transactions.length || 1}
						onPageChange={() => {}}
						label="transactions"
						emptyState={
							<div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
								<Icon name="IconCreditCard" className="size-8 opacity-40" />
								<p className="text-sm">No transactions yet</p>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
