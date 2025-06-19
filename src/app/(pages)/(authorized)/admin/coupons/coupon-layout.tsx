"use client"

import { Button } from "@/components/ui/button"
import { Coupon } from "@/types/coupon.type"
import { Plus } from "lucide-react"
import { useState } from "react"
import CouponCard from "./coupon-card"
import CouponModal from "./coupon-modal"

export default function CouponLayout({ initialCoupons }: { initialCoupons: Coupon[] }) {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

    const handleDeleteCoupon = (_id: string) => {
        setCoupons(coupons.filter((coupon) => coupon._id !== _id))
    }

    const handleToggleActive = (_id: string) => {
        setCoupons(coupons.map((coupon) => (coupon._id === _id ? { ...coupon, isActive: !coupon.isActive } : coupon)))
    }

    const handleCreateCoupon = (couponData: Coupon) => {
        setCoupons([...coupons, couponData])
        setIsModalOpen(false)
        setEditingCoupon(null)
    }

    const handleEditCoupon = (couponData: Coupon) => {
        setCoupons(
            coupons.map((c) => (c._id === couponData._id ? couponData : c)),
        )
        setIsModalOpen(false)
        setEditingCoupon(null)
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Coupon Management</h1>
                    <p className="mt-2">Manage your discount codes and promotional offers</p>
                </div>
                <Button onClick={() => {
                    setEditingCoupon(null)
                    setIsModalOpen(true)
                }} className="flex items-center gap-2 text-white cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Create Coupon
                </Button>
            </div>

            {
                coupons.length === 0 ? (
                    <div className='text-center text-gray-500'>
                        No coupons available. Please create a new coupon.
                    </div>
                ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {
                        coupons.map((coupon) => (
                            <CouponCard
                                key={coupon._id}
                                coupon={coupon}
                                onEdit={(coupon: Coupon) => {
                                    setEditingCoupon(coupon)
                                    setIsModalOpen(true)
                                }}
                                onDelete={handleDeleteCoupon}
                                onToggleActive={handleToggleActive}
                            />
                        ))
                    }
                </div>
            }

            <CouponModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingCoupon(null)
                }}
                onSave={editingCoupon ? handleEditCoupon : handleCreateCoupon}
                editingCoupon={editingCoupon}
            />
        </div>
    )
}
