export interface Transaction {
    id: string;
    date: string;
    amount: number;
    courseName: string;
    purchasedAmount: number;
    originalPrice: number;
    status: "Completed" | "Pending" | "Refunded";
    paymentMethod: "Credit Card" | "PayPal" | "Bank Transfer" | "Debit Card" | "UPI" | "Wallet";
    customerName: string;
    customerEmail: string;
}