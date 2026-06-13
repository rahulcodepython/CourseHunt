export interface Coupon {
    id: number;
    _id: number;
    code: string;
    expiryDate: string;
    usage: number;
    maxUsage: number;
    offerValue: number;
    isActive: boolean;
    description: string;
}

export type CouponType = Coupon;
