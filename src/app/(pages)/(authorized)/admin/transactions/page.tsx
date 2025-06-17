"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaction } from "@/types/transaction.type"
import { Calendar, DollarSign, Download, Filter, Search, ShoppingCart } from "lucide-react"

const transactions: Transaction[] = [
    {
        id: "TXN-2024-001",
        date: "2024-01-15",
        amount: 99.99,
        courseName: "Complete Web Development Bootcamp",
        purchasedAmount: 99.99,
        originalPrice: 199.99,
        status: "Completed",
        paymentMethod: "Credit Card",
        customerName: "John Doe",
        customerEmail: "john.doe@example.com",
    },
    {
        id: "TXN-2024-002",
        date: "2024-01-14",
        amount: 79.99,
        courseName: "React & Next.js Masterclass",
        purchasedAmount: 79.99,
        originalPrice: 149.99,
        status: "Completed",
        paymentMethod: "PayPal",
        customerName: "Sarah Johnson",
        customerEmail: "sarah.j@example.com",
    },
    {
        id: "TXN-2024-003",
        date: "2024-01-13",
        amount: 89.99,
        courseName: "Python for Data Science",
        purchasedAmount: 89.99,
        originalPrice: 169.99,
        status: "Completed",
        paymentMethod: "Credit Card",
        customerName: "Mike Chen",
        customerEmail: "mike.chen@example.com",
    },
    {
        id: "TXN-2024-004",
        date: "2024-01-12",
        amount: 129.99,
        courseName: "Mobile App Development",
        purchasedAmount: 129.99,
        originalPrice: 249.99,
        status: "Pending",
        paymentMethod: "Credit Card",
        customerName: "Emily Davis",
        customerEmail: "emily.davis@example.com",
    },
    {
        id: "TXN-2024-005",
        date: "2024-01-11",
        amount: 69.99,
        courseName: "UI/UX Design Fundamentals",
        purchasedAmount: 69.99,
        originalPrice: 119.99,
        status: "Completed",
        paymentMethod: "Credit Card",
        customerName: "Alex Rodriguez",
        customerEmail: "alex.r@example.com",
    },
    {
        id: "TXN-2024-006",
        date: "2024-01-10",
        amount: 159.99,
        courseName: "Digital Marketing Mastery",
        purchasedAmount: 159.99,
        originalPrice: 299.99,
        status: "Completed",
        paymentMethod: "PayPal",
        customerName: "Lisa Wang",
        customerEmail: "lisa.wang@example.com",
    },
    {
        id: "TXN-2024-007",
        date: "2024-01-09",
        amount: 99.99,
        courseName: "Complete Web Development Bootcamp",
        purchasedAmount: 99.99,
        originalPrice: 199.99,
        status: "Refunded",
        paymentMethod: "Credit Card",
        customerName: "David Wilson",
        customerEmail: "david.wilson@example.com",
    },
    {
        id: "TXN-2024-008",
        date: "2024-01-08",
        amount: 79.99,
        courseName: "React & Next.js Masterclass",
        purchasedAmount: 79.99,
        originalPrice: 149.99,
        status: "Completed",
        paymentMethod: "Credit Card",
        customerName: "Jennifer Brown",
        customerEmail: "jennifer.b@example.com",
    },
];

export default function TransactionsPage() {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Completed":
                return "bg-green-100 text-green-800"
            case "Pending":
                return "bg-yellow-100 text-yellow-800"
            case "Refunded":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const totalRevenue = transactions.filter((t) => t.status === "Completed").reduce((sum, t) => sum + t.amount, 0)

    const pendingAmount = transactions.filter((t) => t.status === "Pending").reduce((sum, t) => sum + t.amount, 0)

    const refundedAmount = transactions.filter((t) => t.status === "Refunded").reduce((sum, t) => sum + t.amount, 0)

    const handleDownloadInvoice = (transactionId: string) => {
        // Simulate invoice download
        alert(`Downloading invoice for transaction ${transactionId}`)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Transaction History</h1>
                        <p className="text-muted-foreground mt-2">View and manage all course purchases and transactions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search transactions..." className="pl-10 w-64" />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Calendar className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                {transactions.filter((t) => t.status === "Pending").length} transactions
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${refundedAmount.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                {transactions.filter((t) => t.status === "Refunded").length} refunds
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transactions.length}</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
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
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <div className="font-mono text-sm">{transaction.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-sm">{transaction.courseName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Purchased: ${transaction.purchasedAmount}
                                                    <span className="line-through ml-1">(${transaction.originalPrice})</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-sm">{transaction.customerName}</div>
                                                <div className="text-xs text-muted-foreground">{transaction.customerEmail}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold">${transaction.amount}</div>
                                            <div className="text-xs text-muted-foreground">{transaction.paymentMethod}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(transaction.id)}>
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Invoice
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
