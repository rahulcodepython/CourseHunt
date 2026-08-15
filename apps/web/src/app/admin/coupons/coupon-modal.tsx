"use client";

import { FormDialog } from "@/components/form-dialog";
import type { Coupon } from "@/schema/coupons.types";
import { CouponForm } from "./coupon-form";

export function CouponModal({
  open,
  onOpenChange,
  editingCoupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCoupon: Coupon | null;
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
