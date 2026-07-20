"use client";

import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";
import { Textarea } from "@package/ui/textarea";
import { useCreateCouponMutation, useUpdateCouponMutation } from "@package/query-hooks/coupons.api";
import type { Coupon } from "@package/schema/coupons.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface CouponFormData {
	code: string;
	expires_at: string;
	usage_count: number;
	max_usage: number;
	discount_percent: number;
	is_active: boolean;
}

interface CouponFormProps {
	onSave: (coupon: CouponFormData) => void;
	onCancel: () => void;
	initialData: Coupon | null;
}

export default function CouponForm({ onSave, onCancel, initialData }: CouponFormProps) {
	const [formData, setFormData] = useState<CouponFormData>({
		code: "",
		expires_at: "",
		usage_count: 0,
		max_usage: 100,
		discount_percent: 10,
		is_active: true,
	});
	const createCouponMutation = useCreateCouponMutation();
	const updateCouponMutation = useUpdateCouponMutation();
	const isLoading = createCouponMutation.isPending || updateCouponMutation.isPending;

	useEffect(() => {
		if (initialData) {
			setFormData({
				code: initialData.code,
				expires_at: initialData.expires_at,
				usage_count: initialData.usage_count,
				max_usage: initialData.max_usage,
				discount_percent: initialData.discount_percent,
				is_active: initialData.is_active,
			});
		}
	}, [initialData]);

	const validateForm = () => {
		if (!formData.code.trim()) {
			toast.warning("Coupon code is required");
			return false;
		}
		if (formData.code.length < 3) {
			toast.warning("Coupon code must be at least 3 characters");
			return false;
		}
		if (!formData.expires_at) {
			toast.warning("Expiry date is required");
			return false;
		}
		if (formData.discount_percent <= 0 || formData.discount_percent > 100) {
			toast.warning("Offer value must be between 1 and 100");
			return false;
		}
		if (formData.max_usage <= 0) {
			toast.warning("Max usage must be greater than 0");
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		if (initialData) {
			await updateCouponMutation.execute({
				id: initialData.id,
				data: {
					discount_percent: formData.discount_percent,
					max_usage: formData.max_usage,
					expires_at: new Date(formData.expires_at).toISOString(),
					is_active: formData.is_active,
				},
			});
			onSave(formData);
			toast.success("Coupon updated successfully");
		} else {
			await createCouponMutation.execute({
				code: formData.code,
				discount_percent: formData.discount_percent,
				max_usage: formData.max_usage,
				expires_at: new Date(formData.expires_at).toISOString(),
				is_active: formData.is_active,
				course_id: null,
			});
			onSave(formData);
			toast.success("Coupon created successfully");
		}
	};

	const handleInputChange = (field: keyof CouponFormData, value: string | number | boolean) => {
		setFormData((prev: CouponFormData) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="space-y-4 p-4">
			<div className="space-y-2">
				<Label htmlFor="code">Coupon Code *</Label>
				<Input id="code" value={formData.code} onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())} placeholder="e.g., SAVE20" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="discount_percent">Offer Value (%) *</Label>
				<Input id="discount_percent" type="number" min="1" max="100" value={formData.discount_percent} onChange={(e) => handleInputChange("discount_percent", Number.parseInt(e.target.value) || 0)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="expires_at">Expiry Date *</Label>
				<Input id="expires_at" type="date" value={formData.expires_at?.split("T")[0] || ""} onChange={(e) => handleInputChange("expires_at", e.target.value)} />
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="usage_count">Current Usage</Label>
					<Input id="usage_count" type="number" min="0" value={formData.usage_count} readOnly />
				</div>
				<div className="space-y-2">
					<Label htmlFor="max_usage">Max Usage *</Label>
					<Input id="max_usage" type="number" min="1" value={formData.max_usage} onChange={(e) => handleInputChange("max_usage", Number.parseInt(e.target.value) || 0)} />
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleInputChange("is_active", checked)} />
				<Label htmlFor="is_active">Active</Label>
			</div>
			<div className="flex gap-3 pt-4">
				<Button type="submit" className="flex-1 cursor-pointer" onClick={handleSubmit} disabled={isLoading}>
					{initialData ? "Update Coupon" : "Create Coupon"}
				</Button>
				<Button type="button" variant="outline" onClick={onCancel} className="flex-1 cursor-pointer">
					Cancel
				</Button>
			</div>
		</div>
	);
}
