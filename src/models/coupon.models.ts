import { Schema, model, models } from 'mongoose';


const CouponSchema = new Schema({
    code: { type: String, required: true },
    expiryDate: { type: String, required: true },
    usage: { type: Number, required: true },
    maxUsage: { type: Number, required: true },
    offerValue: { type: Number, required: true },
    isActive: { type: Boolean, required: true },
    description: { type: String },
});

export const Coupon = models.Coupon || model("Coupon", CouponSchema);