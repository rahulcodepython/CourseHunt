export interface UserTransactionType {
    _id: string;
    transactionId: string;
    createdAt: string;
    courseName: string;
    couponCode?: string;
    amount: number;
}