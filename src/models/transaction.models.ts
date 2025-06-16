import { Schema, model, models } from 'mongoose';


const TransactionSchema = new Schema({
    transactionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: false },
    couponCode: { type: String, required: false },
    amount: { type: Number, required: true },
});

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);