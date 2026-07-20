"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useTransactionsQuery } from "@package/query-hooks/transactions.api";
import type { Transaction } from "@package/schema/transactions.types";
import { toast } from "sonner";
import Loading from "@package/components/loading";
import { Badge } from "@package/ui/badge";

export default function Transaction() {
	const { data: raw, isLoading } = useTransactionsQuery();

	if (isLoading) return <Loading />;

	const paginatedData = raw?.data;
	const transactionList: Transaction[] = paginatedData ? (paginatedData.data as unknown as Transaction[]) : [];
	const stats = {
		totalRevenue: transactionList.reduce((sum: number, t: Transaction) => sum + (t.status === "confirmed" ? t.amount : 0), 0),
		totalRefunds: transactionList.reduce((sum: number, t: Transaction) => sum + (t.status === "refunded" ? t.amount : 0), 0),
		refundsCount: transactionList.filter((t: Transaction) => t.status === "refunded" || t.status === "pending").length,
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">Transaction History</h1>
						<p className="text-muted-foreground mt-2">View and manage all course purchases and transactions</p>
					</div>
				</div>

				{stats && (
					<div className="grid gap-6 md:grid-cols-3 mb-8">
						<Card>
							<CardContent className="pt-6">
								<div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
								<p className="text-sm text-muted-foreground">Total Net Revenue</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-2xl font-bold text-destructive">₹{stats.totalRefunds.toFixed(2)}</div>
								<p className="text-sm text-muted-foreground">Total Refunded</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-2xl font-bold text-amber-500">{stats.refundsCount}</div>
								<p className="text-sm text-muted-foreground">Refund Requests Processed</p>
							</CardContent>
						</Card>
					</div>
				)}

				<Card>
					<CardHeader>
						<CardTitle>All Transactions</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Transaction ID</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Course</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactionList.length === 0 ? (
									<TableRow>
										<TableCell className="text-center py-10" colSpan={6}>
											<p className="text-muted-foreground">No transactions happened yet.</p>
										</TableCell>
									</TableRow>
								) : (
									transactionList.map((transaction: Transaction) => (
									<TableRow key={transaction.id}>
											<TableCell>
												<div className="font-mono text-xs truncate max-w-[120px]">{transaction.razorpay_order_id || transaction.id}</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2 text-sm">
													<Icon name="IconCalendar" className="h-4 w-4 text-muted-foreground" />
													{new Date(transaction.created_at).toLocaleDateString()}
												</div>
											</TableCell>
											<TableCell>
												<div className="font-medium text-sm">{transaction.course?.title || "Unknown"}</div>
											</TableCell>
											<TableCell>
												<div className="font-bold">₹{transaction.amount}</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={transaction.status === "refunded" ? "destructive" : transaction.status === "pending" ? "secondary" : "default"}
													className={transaction.status === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}
												>
													{transaction.status?.toUpperCase() || "UNKNOWN"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button variant="outline" size="sm">
														<Icon name="IconDownload" className="h-4 w-4 mr-1" />
														Invoice
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
