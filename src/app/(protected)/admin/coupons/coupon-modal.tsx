import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Coupon } from "@/types/coupon.type"
import CouponForm from "./coupon-form"

interface CouponModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (coupon: Coupon) => void
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
