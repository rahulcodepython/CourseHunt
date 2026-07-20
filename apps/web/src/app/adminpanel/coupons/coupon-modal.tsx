import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog"

import CouponForm from "./coupon-form"
import type { CouponFormData } from "./coupon-form"
import type { Coupon } from "@package/schema/coupons.types";

interface CouponModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (coupon: CouponFormData) => void
    editingCoupon: Coupon | null
}

export default function CouponModal({ isOpen, onClose, onSave, editingCoupon }: CouponModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                </DialogHeader>
                <CouponForm onSave={onSave} onCancel={onClose} initialData={editingCoupon} />
            </DialogContent>
        </Dialog>
    )
}
