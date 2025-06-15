export interface Coupon {
    _id: string | null
    code: string
    expiryDate: string
    usage: number
    maxUsage: number
    offerValue: number
    isActive: boolean
    description?: string
}