export interface UserTransactionType {
    _id: string;
    transactionId: string;
    createdAt: string;
    courseName: string;
    couponCode?: string;
    amount: number;
}

export interface AdminTransactionType {
    _id: string;
    transactionId: string;
    createdAt: string;
    courseName: string;
    userId: string;
    userEmail: string;
    couponCode?: string;
    amount: number;
}