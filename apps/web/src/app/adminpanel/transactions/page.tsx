"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminTransactionsQuery, useAcceptRefundMutation, useRejectRefundMutation } from "@/hooks/api"
import { toast } from "sonner";
import Loading from "@/components/loading";

import { Badge } from "@/components/ui/badge"

export default function Transaction() {
    const { data: responseData, isLoading } = useAdminTransactionsQuery()
    const acceptMutation = useAcceptRefundMutation()
    const rejectMutation = useRejectRefundMutation()

    if (isLoading) return <Loading />

    const transactionList = responseData?.transactions ?? [];
    const stats = responseData?.stats;

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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Coupon</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    transactionList.length === 0 ? <TableRow>
                                        <TableCell className="text-center" colSpan={6}>
                                            <p>No transactions happened yet.</p>
                                        </TableCell>
                                    </TableRow> : transactionList.map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell>
                                                <div className="font-mono text-sm truncate">{transaction.transactionId.slice(0, 40)}...</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon name="IconCalendar" className="h-5 w-5 text-muted-foreground" />
                                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-sm">{transaction.courseName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-sm">{transaction.couponCode}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold">₹{transaction.amount}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={transaction.status === "refunded" ? "destructive" : transaction.status === "pending" ? "secondary" : "default"}
                                                    className={transaction.status === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}
                                                >
                                                    {transaction.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {transaction.status === "pending" && (
                                                        <>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => acceptMutation.mutate(transaction.id)}
                                                                disabled={acceptMutation.isPending}
                                                            >
                                                                <Icon name="IconCheck" className="h-5 w-5 mr-1" />
                                                                Accept
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => rejectMutation.mutate(transaction.id)}
                                                                disabled={rejectMutation.isPending}
                                                            >
                                                                <Icon name="IconX" className="h-5 w-5 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button variant="outline" size="sm">
                                                        <Icon name="IconDownload" className="h-5 w-5 mr-1" />
                                                        Invoice
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
