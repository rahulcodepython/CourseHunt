export interface TransactionType {
    id: number;
    _id: number;
    transactionId: string;
    createdAt: string;
    courseId?: number;
    courseName: string;
    userId?: string;
    userEmail?: string;
    couponId?: number | null;
    couponCode: string;
    amount: number;
}
