"use client";

import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";
import { useCreateCouponMutation, useUpdateCouponMutation } from "@package/query-hooks/coupons.api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface CouponFormData {
    code: string;
    discount_percent: number;
    expires_at: string;
    max_usage: number;
    is_active: boolean;
}

export function CouponForm({ editingCoupon, onSuccess }: { editingCoupon: any | null; onSuccess: () => void }) {
    const createMutation = useCreateCouponMutation();
    const updateMutation = useUpdateCouponMutation();
    const [form, setForm] = useState<CouponFormData>({
        code: "",
        discount_percent: 0,
        expires_at: "",
        max_usage: 0,
        is_active: true,
    });

    useEffect(() => {
        if (editingCoupon) {
            setForm({
                code: editingCoupon.code || "",
                discount_percent: editingCoupon.discount_percent || 0,
                expires_at: editingCoupon.expires_at?.split("T")[0] || "",
                max_usage: editingCoupon.max_usage || 0,
                is_active: editingCoupon.is_active ?? true,
            });
        }
    }, [editingCoupon]);

    const handleSubmit = async () => {
        if (!form.code || form.code.length < 3) {
            toast.error("Coupon code must be at least 3 characters");
            return;
        }
        if (!form.expires_at) {
            toast.error("Expiry date is required");
            return;
        }
        if (form.discount_percent < 1 || form.discount_percent > 100) {
            toast.error("Discount must be between 1 and 100");
            return;
        }
        if (form.max_usage <= 0) {
            toast.error("Max usage must be greater than 0");
            return;
        }

        const data = {
            code: form.code,
            discount_percent: form.discount_percent,
            expires_at: form.expires_at,
            max_usage: form.max_usage,
            is_active: form.is_active,
        };

        if (editingCoupon) {
            await updateMutation.execute({ id: editingCoupon.id, data });
        } else {
            await createMutation.execute(data);
        }
        onSuccess();
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE50"
                    className="font-mono"
                />
            </div>
            <div className="space-y-2">
                <Label>Offer Value (%)</Label>
                <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })}
                />
            </div>
            <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
            </div>
            {editingCoupon && (
                <div className="space-y-2">
                    <Label>Current Usage</Label>
                    <Input value={editingCoupon.usage_count || 0} disabled />
                </div>
            )}
            <div className="space-y-2">
                <Label>Max Usage</Label>
                <Input
                    type="number"
                    min={1}
                    value={form.max_usage}
                    onChange={(e) => setForm({ ...form, max_usage: parseInt(e.target.value) || 0 })}
                />
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    checked={form.is_active}
                    onCheckedChange={(v: boolean) => setForm({ ...form, is_active: v })}
                />
                <Label>Active</Label>
            </div>
            <Button onClick={handleSubmit} className="w-full">
                {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
        </div>
    );
}
