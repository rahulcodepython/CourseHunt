"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Mail, MapPin, Phone, Tag, User } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const courseData = {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "John Smith",
    image: "/placeholder.svg?height=200&width=300",
    originalPrice: 199.99,
    discountedPrice: 99.99,
    duration: "40 hours",
    lessons: 156,
    level: "Beginner to Advanced",
    features: [
        "Lifetime access",
        "Certificate of completion",
        "30-day money-back guarantee",
        "Mobile and TV access",
        "Assignments and quizzes",
    ],
}

export default function CheckoutPage() {
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("card")
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardName: "",
    })

    const discount = appliedCoupon ? 20 : 0
    const finalPrice = courseData.discountedPrice - (courseData.discountedPrice * discount) / 100
    const savings = courseData.originalPrice - finalPrice

    const handleApplyCoupon = () => {
        if (couponCode.toLowerCase() === "save20") {
            setAppliedCoupon("SAVE20")
            alert("Coupon applied! 20% discount added.")
        } else {
            alert("Invalid coupon code")
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert("Order placed successfully!")
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                        <Button variant="outline" className="cursor-pointer" onClick={() => window.history.back()}>
                            Back to Courses
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Billing Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Billing Information
                                    </CardTitle>
                                    <CardDescription>Please provide your billing details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    className="pl-10"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    placeholder="+1 (555) 123-4567"
                                                    className="pl-10"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="address"
                                                placeholder="123 Main Street"
                                                className="pl-10"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange("address", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                placeholder="New York"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">ZIP Code</Label>
                                            <Input
                                                id="zipCode"
                                                placeholder="10001"
                                                value={formData.zipCode}
                                                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                placeholder="United States"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Payment Method
                                    </CardTitle>
                                    <CardDescription>Choose your preferred payment method</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="card" id="card" />
                                            <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                                                <CreditCard className="h-4 w-4" />
                                                Credit/Debit Card
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                                            <RadioGroupItem value="paypal" id="paypal" disabled />
                                            <Label htmlFor="paypal" className="flex items-center gap-2">
                                                PayPal (Coming Soon)
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {paymentMethod === "card" && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <div className="space-y-2">
                                                <Label htmlFor="cardName">Cardholder Name *</Label>
                                                <Input
                                                    id="cardName"
                                                    placeholder="John Doe"
                                                    value={formData.cardName}
                                                    onChange={(e) => handleInputChange("cardName", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cardNumber">Card Number *</Label>
                                                <Input
                                                    id="cardNumber"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={formData.cardNumber}
                                                    onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                                                    <Input
                                                        id="expiryDate"
                                                        placeholder="MM/YY"
                                                        value={formData.expiryDate}
                                                        onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="cvv">CVV *</Label>
                                                    <Input
                                                        id="cvv"
                                                        placeholder="123"
                                                        value={formData.cvv}
                                                        onChange={(e) => handleInputChange("cvv", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex gap-4">
                                        <Image
                                            src={courseData.image || "/placeholder.svg"}
                                            alt={courseData.title}
                                            width={80}
                                            height={60}
                                            className="rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">{courseData.title}</h3>
                                            <p className="text-sm text-muted-foreground">by {courseData.instructor}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {courseData.level}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{courseData.duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">What's included:</h4>
                                        <ul className="space-y-1">
                                            {courseData.features.map((feature, index) => (
                                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Separator />

                                    {/* Coupon Code */}
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            Coupon Code
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                            />
                                            <Button variant="outline" onClick={handleApplyCoupon}>
                                                Apply
                                            </Button>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="text-sm text-green-600">✓ Coupon "{appliedCoupon}" applied successfully!</div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Original Price</span>
                                            <span className="line-through text-muted-foreground">${courseData.originalPrice}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Course Price</span>
                                            <span>${courseData.discountedPrice}</span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Coupon Discount ({discount}%)</span>
                                                <span>-${((courseData.discountedPrice * discount) / 100).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>${finalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="text-sm text-green-600 text-center">You save ${savings.toFixed(2)}!</div>
                                    </div>

                                    <Button className="w-full text-white bg-green-600 hover:bg-green-700 cursor-pointer" size="lg" onClick={handleSubmit}>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Complete Purchase
                                    </Button>

                                    <div className="text-xs text-muted-foreground text-center">
                                        <Lock className="h-3 w-3 inline mr-1" />
                                        Secure checkout powered by SSL encryption
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
