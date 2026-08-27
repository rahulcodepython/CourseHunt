"use client";

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import type { Transaction } from "@/schema/transactions.types";
import { formatDate, formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const styles = StyleSheet.create({
    page: {
        padding: 48,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#171717",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 32,
    },
    brand: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: "#16a34a",
    },
    invoiceTitle: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
    },
    meta: {
        color: "#525252",
        textAlign: "right",
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        color: "#737373",
        marginBottom: 2,
    },
    value: {
        fontFamily: "Helvetica-Bold",
    },
    table: {
        borderTopWidth: 1,
        borderTopColor: "#e5e5e5",
        marginTop: 8,
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
        paddingVertical: 8,
    },
    headerCell: {
        fontFamily: "Helvetica-Bold",
        color: "#737373",
    },
    colCourse: { flex: 3 },
    colStatus: { flex: 1, textTransform: "capitalize" },
    colAmount: { flex: 1, textAlign: "right" },
    breakdownRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    breakdownLabel: {
        color: "#525252",
    },
    breakdownValue: {
        fontFamily: "Helvetica-Bold",
    },
    discountValue: {
        fontFamily: "Helvetica-Bold",
        color: "#16a34a",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 16,
    },
    totalLabel: {
        marginRight: 16,
        fontFamily: "Helvetica-Bold",
    },
    totalValue: {
        fontFamily: "Helvetica-Bold",
        fontSize: 14,
    },
    footer: {
        marginTop: 48,
        fontSize: 9,
        color: "#a3a3a3",
        textAlign: "center",
    },
});

function InvoiceDocument({ transaction }: { transaction: Transaction }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <Text style={styles.brand}>COURSEHUNT</Text>
                    <View>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.meta}>{transaction.razorpay_order_id || transaction.id}</Text>
                        <Text style={styles.meta}>{formatDate(transaction.created_at)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Billed to</Text>
                    <Text style={styles.value}>{transaction.user.name}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.row}>
                        <Text style={[styles.colCourse, styles.headerCell]}>Course</Text>
                        <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colCourse}>{transaction.course.title}</Text>
                        <Text style={styles.colStatus}>{transaction.status}</Text>
                    </View>
                </View>

                <View style={[styles.section, { marginTop: 16 }]}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Actual Price</Text>
                        <Text style={styles.breakdownValue}>{formatINR(transaction.actual_price)}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Offered Price</Text>
                        <Text style={styles.breakdownValue}>{formatINR(transaction.offered_price)}</Text>
                    </View>
                    {transaction.discount_amount > 0 && (
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>
                                Coupon Discount{transaction.coupon.code ? ` (${transaction.coupon.code})` : ""}
                            </Text>
                            <Text style={styles.discountValue}>- {formatINR(transaction.discount_amount)}</Text>
                        </View>
                    )}
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Tax ({transaction.tax_percent || 18}%)</Text>
                        <Text style={styles.breakdownValue}>
                            + {formatINR(transaction.amount - (transaction.offered_price - transaction.discount_amount))}
                        </Text>
                    </View>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Final Price Paid</Text>
                    <Text style={styles.totalValue}>{formatINR(transaction.amount)}</Text>
                </View>

                <Text style={styles.footer}>This is a system-generated invoice and does not require a signature.</Text>
            </Page>
        </Document>
    );
}

export function InvoiceDownloadButton({ transaction }: { transaction: Transaction }) {
    return (
        <PDFDownloadLink document={<InvoiceDocument transaction={transaction} />} fileName={`invoice-${transaction.id}.pdf`}>
            {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading}>
                    <Icon name="download" className="size-3.5" />
                    {loading ? "Preparing..." : "Invoice"}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
