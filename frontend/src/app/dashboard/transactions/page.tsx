"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUserTransactionsQuery } from "@/hooks/api"
import { IconCalendar, IconDownload } from "@tabler/icons-react";

export default function Transaction() {
    const { data: transactions, isLoading } = useUserTransactionsQuery()

    if (isLoading) return <div className="p-8">Loading transactions...</div>

    const transactionList = transactions ?? [];

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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Coupon</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    transactionList.length === 0 ? <TableRow>
                                        <TableCell className="text-center" colSpan={6}>
                                            <p>You have not made any transactions yet.</p>
                                        </TableCell>
                                    </TableRow> : transactionList.map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell>
                                                <div className="font-mono text-sm truncate">{transaction.transactionId.slice(0, 40)}...</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
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
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <IconDownload className="h-4 w-4 mr-1" />
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
