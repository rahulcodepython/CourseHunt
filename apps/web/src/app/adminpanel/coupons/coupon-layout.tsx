"use client";

import { Icon } from "@package/components/icon";
import { useCouponsQuery } from "@package/query-hooks/coupons.api";
import { Button } from "@package/ui/button";
import type { Coupon } from "@package/schema/coupons.types";
import type { CouponFormData } from "./coupon-form";
import { useState } from "react";
import CouponCard from "./coupon-card";
import CouponModal from "./coupon-modal";

export default function CouponLayout() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
	const couponsQuery = useCouponsQuery();
	const paginatedData = couponsQuery.data?.data;
	const coupons: Coupon[] = paginatedData ? (paginatedData.data as unknown as Coupon[]) : [];

	const handleCouponSaved = (_couponData: CouponFormData) => {
		setIsModalOpen(false);
		setEditingCoupon(null);
	};

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold">Coupon Management</h1>
					<p className="mt-2">Manage your discount codes and promotional offers</p>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						setEditingCoupon(null);
						setIsModalOpen(true);
					}}
					className="flex items-center gap-2 cursor-pointer"
				>
					<Icon name="IconPlus" className="h-5 w-5" />
					Create Coupon
				</Button>
			</div>

			{coupons.length === 0 ? (
				<div className="text-center text-gray-500">No coupons available. Please create a new coupon.</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{coupons.map((coupon: Coupon) => (
						<CouponCard
							key={coupon.id}
							coupon={coupon}
							onEdit={(coupon: Coupon) => {
								setEditingCoupon(coupon);
								setIsModalOpen(true);
							}}
						/>
					))}
				</div>
			)}

			<CouponModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingCoupon(null);
				}}
				onSave={handleCouponSaved}
				editingCoupon={editingCoupon}
			/>
		</div>
	);
}
