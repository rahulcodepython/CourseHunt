"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { useCouponsQuery } from "@package/query-hooks/coupons.api";
import { CouponCard } from "./coupon-card";
import { CouponModal } from "./coupon-modal";
import { useState } from "react";
import Loading from "@package/components/loading";

export function CouponLayout() {
    const { data: raw, isLoading } = useCouponsQuery();
    const coupons = raw?.data?.data ?? [];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const openCreate = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const openEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Coupons</h1>
                    <p className="text-muted-foreground text-sm">Manage discount coupons</p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Coupon
                </Button>
            </div>

            {isLoading ? (
                <Loading />
            ) : coupons.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Icon name="IconTicket" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No coupons available. Please create a new coupon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon: any) => (
                        <CouponCard key={coupon.id} coupon={coupon} onEdit={() => openEdit(coupon)} />
                    ))}
                </div>
            )}

            <CouponModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                editingCoupon={editingCoupon}
            />
        </div>
    );
}
