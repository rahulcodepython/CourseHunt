"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useMyTransactionsQuery } from "@package/query-hooks/transactions.api";
import type { Transaction } from "@package/schema/transactions.types";
import { useState } from "react";

const columns: DataTableColumn<Transaction>[] = [
	{
		header: "Transaction ID",
		render: (tx) => (
			<div className="font-mono text-xs truncate max-w-[120px]">
				{tx.razorpay_order_id || tx.id}
			</div>
		),
	},
	{
		header: "Date",
		render: (tx) => (
			<div className="flex items-center gap-2 text-sm">
				<Icon name="IconCalendar" className="h-4 w-4 text-muted-foreground" />
				{new Date(tx.created_at).toLocaleDateString()}
			</div>
		),
	},
	{
		header: "Course",
		render: (tx) => (
			<div className="font-medium text-sm">{tx.course?.title || "Unknown"}</div>
		),
	},
	{
		header: "Amount",
		render: (tx) => (
			<div className="font-bold">₹{tx.amount}</div>
		),
		className: "text-right",
	},
	{
		header: "Actions",
		render: () => (
			<Button variant="outline" size="sm">
				<Icon name="IconDownload" className="h-4 w-4 mr-1" />
				Invoice
			</Button>
		),
		className: "text-right",
	},
];

export default function Transaction() {
	const [page, setPage] = useState(1);
	const limit = 10;

	const { data: raw, isLoading } = useMyTransactionsQuery({ page, limit });
	const paginatedData = raw?.data;

	const transactionList: Transaction[] = paginatedData?.data ?? [];
	const total = paginatedData?.total ?? 0;
	const totalPages = paginatedData ? Math.ceil(paginatedData.total / paginatedData.limit) : 0;

	return (
		<div className="bg-background w-full">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">Transaction History</h1>
						<p className="text-muted-foreground mt-2">View all course purchases and transactions</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>All Transactions</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<DataTable
							columns={columns}
							data={transactionList}
							keyExtractor={(tx) => tx.id}
							isLoading={isLoading}
							page={page}
							totalPages={totalPages}
							total={total}
							pageSize={limit}
							onPageChange={setPage}
							label="transactions"
							emptyState={
								<div className="flex flex-col items-center gap-2 py-10">
									<Icon name="IconReceipt" className="w-10 h-10 text-muted-foreground/50" />
									<p className="text-muted-foreground">You have not made any transactions yet.</p>
								</div>
							}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
