"use client";

import { FormDialog } from "@/components/form-dialog";
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
      description={
        editingCoupon
          ? "Update the coupon details"
          : "Create a new discount coupon"
      }
    >
      <CouponForm editingCoupon={editingCoupon} onSuccess={() => onOpenChange(false)} />
    </FormDialog>
  );
}
