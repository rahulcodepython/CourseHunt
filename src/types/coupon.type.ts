export interface Coupon {
    id: string
    code: string
    expiryDate: string
    usage: number
    maxUsage: number
    offerValue: number
    isActive: boolean
    description?: string
}