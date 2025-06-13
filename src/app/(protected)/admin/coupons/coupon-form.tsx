"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Coupon } from "@/types/coupon.type"
import { useEffect, useState } from "react"

interface CouponFormProps {
    onSave: (coupon: Omit<Coupon, "id">) => void
    onCancel: () => void
    initialData: Coupon | null
}

export default function CouponForm({ onSave, onCancel, initialData }: CouponFormProps) {
    const [formData, setFormData] = useState({
        code: "",
        expiryDate: "",
        usage: 0,
        maxUsage: 100,
        offerValue: 10,
        isActive: true,
        description: "",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
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
        const newErrors: Record<string, string> = {}

        if (!formData.code.trim()) {
            newErrors.code = "Coupon code is required"
        } else if (formData.code.length < 3) {
            newErrors.code = "Coupon code must be at least 3 characters"
        }

        if (!formData.expiryDate) {
            newErrors.expiryDate = "Expiry date is required"
        } else if (new Date(formData.expiryDate) <= new Date()) {
            newErrors.expiryDate = "Expiry date must be in the future"
        }

        if (formData.offerValue <= 0 || formData.offerValue > 100) {
            newErrors.offerValue = "Offer value must be between 1 and 100"
        }

        if (formData.maxUsage <= 0) {
            newErrors.maxUsage = "Max usage must be greater than 0"
        }

        if (formData.usage < 0) {
            newErrors.usage = "Usage cannot be negative"
        }

        if (formData.usage > formData.maxUsage) {
            newErrors.usage = "Usage cannot exceed max usage"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            onSave(formData)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coupon Code */}
            <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
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
                    className={errors.offerValue ? "border-red-500" : ""}
                />
                {errors.offerValue && <p className="text-sm text-red-500">{errors.offerValue}</p>}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    className={errors.expiryDate ? "border-red-500" : ""}
                />
                {errors.expiryDate && <p className="text-sm text-red-500">{errors.expiryDate}</p>}
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
                        className={errors.usage ? "border-red-500" : ""}
                    />
                    {errors.usage && <p className="text-sm text-red-500">{errors.usage}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxUsage">Max Usage *</Label>
                    <Input
                        id="maxUsage"
                        type="number"
                        min="1"
                        value={formData.maxUsage}
                        onChange={(e) => handleInputChange("maxUsage", Number.parseInt(e.target.value) || 0)}
                        className={errors.maxUsage ? "border-red-500" : ""}
                    />
                    {errors.maxUsage && <p className="text-sm text-red-500">{errors.maxUsage}</p>}
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
                <Button type="submit" className="flex-1 cursor-pointer">
                    {initialData ? "Update Coupon" : "Create Coupon"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 cursor-pointer">
                    Cancel
                </Button>
            </div>
        </form>
    )
}
