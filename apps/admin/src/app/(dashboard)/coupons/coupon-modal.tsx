"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { CouponForm } from "./coupon-form";

export function CouponModal({
    open,
    onOpenChange,
    editingCoupon,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCoupon: any | null;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
                    <DialogDescription>
                        {editingCoupon
                            ? "Update the coupon details"
                            : "Create a new discount coupon"}
                    </DialogDescription>
                </DialogHeader>
                <CouponForm editingCoupon={editingCoupon} onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
