"use client"


import createCoupon from "@/api/create.coupon.api"
import updateCoupon from "@/api/update.coupon.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { Coupon } from "@/types/coupon.type"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface CouponFormProps {
    onSave: (coupon: Coupon) => void
    onCancel: () => void
    initialData: Coupon | null
}

export default function CouponForm({ onSave, onCancel, initialData }: CouponFormProps) {
    const [formData, setFormData] = useState<Coupon>({
        _id: null, // Optional, only used when editing an existing coupon
        code: "",
        expiryDate: "",
        usage: 0,
        maxUsage: 100,
        offerValue: 10,
        isActive: true,
        description: "",
    })
    const { isLoading, callApi } = useApiHandler()

    useEffect(() => {
        if (initialData) {
            setFormData({
                _id: initialData._id, // Include _id if editing an existing coupon
                code: initialData.code,
                expiryDate: initialData.expiryDate,
                usage: initialData.usage,
                maxUsage: initialData.maxUsage,
                offerValue: initialData.offerValue,
                isActive: initialData.isActive,
                description: initialData.description || "",
            })
        }
    }, [initialData])

    const validateForm = () => {
        if (!formData.code.trim()) {
            toast.warning("Coupon code is required")
            return false
        } else if (formData.code.length < 3) {
            toast.warning("Coupon code must be at least 3 characters")
            return false
        }

        if (!formData.expiryDate) {
            toast.warning("Expiry date is required")
            return false
        } else if (new Date(formData.expiryDate) <= new Date()) {
            toast.warning("Expiry date must be in the future")
            return false
        }

        if (formData.offerValue <= 0 || formData.offerValue > 100) {
            toast.warning("Offer value must be between 1 and 100")
            return false
        }

        if (formData.maxUsage <= 0) {
            toast.warning("Max usage must be greater than 0")
            return false
        }

        if (formData.usage < 0) {
            toast.warning("Usage cannot be negative")
            return false
        }

        if (formData.usage > formData.maxUsage) {
            toast.warning("Usage cannot exceed max usage")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (validateForm()) {

            if (initialData) {
                if (initialData._id === null) {
                    toast.error("Invalid coupon ID for update")
                    return
                }

                const responseData: { message: string, coupon: Coupon } = await callApi(() => updateCoupon(formData, initialData._id))
                if (responseData) {
                    onSave(responseData.coupon)
                    toast.success(responseData.message || "Coupon updated successfully")
                }
            } else {
                const { _id, ...newFormData } = formData;
                const responseData: { message: string, coupon: Coupon } = await callApi(() => createCoupon(newFormData))
                if (responseData) {
                    onSave(responseData.coupon)
                    toast.success(responseData.message || "Coupon created successfully")
                }
            }
        }
    }

    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="space-y-4">
            {/* Coupon Code */}
            <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the offer"
                    rows={2}
                />
            </div>

            {/* Offer Value */}
            <div className="space-y-2">
                <Label htmlFor="offerValue">Offer Value (%) *</Label>
                <Input
                    id="offerValue"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.offerValue}
                    onChange={(e) => handleInputChange("offerValue", Number.parseInt(e.target.value) || 0)}
                />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="usage">Current Usage</Label>
                    <Input
                        id="usage"
                        type="number"
                        min="0"
                        value={formData.usage}
                        readOnly // Make usage read-only if editing an existing coupon
                        onChange={(e) => handleInputChange("usage", Number.parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxUsage">Max Usage *</Label>
                    <Input
                        id="maxUsage"
                        type="number"
                        min="1"
                        value={formData.maxUsage}
                        onChange={(e) => handleInputChange("maxUsage", Number.parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 cursor-pointer" onClick={handleSubmit} disabled={isLoading}>
                    {initialData ? "Update Coupon" : "Create Coupon"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 cursor-pointer">
                    Cancel
                </Button>
            </div>
        </div>
    )
}
