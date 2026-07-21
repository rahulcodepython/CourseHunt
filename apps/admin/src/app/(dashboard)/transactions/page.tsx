"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useTransactionsQuery } from "@package/query-hooks/transactions.api";
import type { Transaction } from "@package/schema/transactions.types";

export default function TransactionsPage() {
	const { data: raw, isLoading } = useTransactionsQuery();
	const transactions: Transaction[] = raw?.data?.data ?? [];

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
			render: (t) => <span className="font-mono text-xs">{t.id?.slice(0, 12)}...</span>,
		},
		{
			header: "Date",
			render: (t) => <span className="text-sm">{new Date(t.created_at).toLocaleDateString()}</span>,
		},
		{
			header: "User",
			render: (t) => <span className="text-sm">{t.user.name}</span>,
		},
		{
			header: "Course",
			render: (t) => <span className="text-sm">{t.course.title || "—"}</span>,
		},
		{
			header: "Amount",
			render: (t) => <span className="font-medium">₹{t.amount?.toLocaleString() || "0"}</span>,
			className: "text-right",
			headerClassName: "text-right",
		},
		{
			header: "Status",
			render: (t) => (
				<Badge variant={
					t.status === "confirmed" ? "secondary" :
					t.status === "refunded" ? "destructive" : "outline"
				} className={
					t.status === "confirmed" ? "bg-green-100 text-green-800" : ""
				}>
					{t.status}
				</Badge>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Transactions</h1>
				<p className="text-muted-foreground text-sm">View all platform transactions and refunds</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total Net Revenue</CardTitle>
						<Icon name="IconCurrencyRupee" className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
						<Icon name="IconArrowBackUp" className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">₹{totalRefunds.toLocaleString()}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Refund Requests</CardTitle>
						<Icon name="IconReceiptRefund" className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{refundsCount}</div>
					</CardContent>
				</Card>
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
						isLoading={isLoading}
						page={1}
						totalPages={1}
						total={transactions.length}
						pageSize={transactions.length || 1}
						onPageChange={() => {}}
						label="transactions"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
