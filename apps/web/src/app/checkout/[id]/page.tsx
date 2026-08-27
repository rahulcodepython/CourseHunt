"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCheckoutCourseQuery } from "@/query-hooks/transactions.api";
import { useInitiateTransactionMutation } from "@/query-hooks/transactions.api";
import { useEnrollFreeMutation } from "@/query-hooks/courses.api";
import { useCheckCouponQuery } from "@/query-hooks/coupons.api";
import useSession from "@/hooks/use-session";
import { loadRazorpayScript } from "@/lib/razorpay";
import { ROUTES } from "@/lib/const";
import { formatINR } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/icon";
import { Loading } from "@/components/loading";
import { LoadingButton } from "@/components/loading-button";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();

  const { data: raw, isLoading } = useCheckoutCourseQuery(id);
  const course = raw?.data;

  const [couponInput, setCouponInput] = React.useState("");
  const [appliedCode, setAppliedCode] = React.useState<string | null>(null);
  const { data: rawCoupon, isFetching: isCheckingCoupon } = useCheckCouponQuery(appliedCode ?? "", id, !!appliedCode);
  const couponCheck = rawCoupon?.data;

  const initiateTransaction = useInitiateTransactionMutation();
  const enrollFree = useEnrollFreeMutation();
  const [isPaying, setIsPaying] = React.useState(false);

  if (isLoading) return <Loading />;

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <Icon name="ban" className="size-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  // Mirrors the backend's authoritative computation in InitiateService
  // exactly (discount off final_price, then tax on the discounted amount) —
  // this is a preview only; the server recomputes and never trusts it.
  const couponApplied = Boolean(appliedCode && couponCheck?.valid);
  const discount = couponApplied ? (course.final_price * (couponCheck?.discount_percent ?? 0)) / 100 : 0;
  const discountedAmount = Math.max(0, course.final_price - discount);
  const tax = (discountedAmount * course.tax_percent) / 100;
  const total = discountedAmount + tax;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    setAppliedCode(couponInput.trim());
  };

  const handleEnrollFree = async () => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    const res = await enrollFree.execute(course.id);
    if (res?.success) router.push(`/student/study/${course.id}`);
  };

  const handlePayment = async () => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    setIsPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load the payment gateway. Please try again.");
        return;
      }

      const res = await initiateTransaction.execute({
        course_id: course.id,
        coupon_code: couponApplied ? appliedCode : null,
      });
      if (!res?.success || !res.data) {
        toast.error(res?.message || "Failed to start checkout.");
        return;
      }

      const { transaction_id, razorpay_order_id, amount, currency, razorpay_key } = res.data;

      if (!window.Razorpay) return;
      const rzp = new window.Razorpay({
        key: razorpay_key,
        amount: Math.round(amount * 100),
        currency,
        order_id: razorpay_order_id,
        name: "CourseHunt",
        description: course.title,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#16a34a" },
        handler: () => {
          router.push(`/checkout/confirmation/${transaction_id}`);
        },
        modal: {
          ondismiss: () => toast.info("Payment cancelled."),
        },
      });
      rzp.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="mt-1 text-muted-foreground">Review your order and complete your purchase</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-15 w-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                    {course.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={course.image_url} alt={course.title} className="size-full object-cover" />
                    ) : (
                      <Icon name="book" className="size-5 opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
                  </div>
                </div>
                {!course.is_free && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Course Price</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatINR(course.final_price)}</span>
                        {course.final_price < course.actual_price && (
                          <span className="text-xs text-muted-foreground line-through">{formatINR(course.actual_price)}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {!course.is_free && (
              <Card>
                <CardHeader>
                  <CardTitle>Have a Coupon?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setAppliedCode(null);
                      }}
                      className="uppercase"
                    />
                    <LoadingButton
                      variant="outline"
                      disabled={!couponInput.trim()}
                      loading={isCheckingCoupon}
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </LoadingButton>
                  </div>
                  {appliedCode && !isCheckingCoupon && couponCheck && (
                    <p className={couponCheck.valid ? "text-sm text-green-600" : "text-sm text-destructive"}>
                      {couponCheck.valid
                        ? `Coupon applied: ${couponCheck.discount_percent}% off`
                        : `Coupon not applicable (${couponCheck.reason ?? "invalid"})`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-12">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.is_free ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={enrollFree.isPending}
                      onClick={handleEnrollFree}
                    >
                      {user ? "Enroll for Free" : "Log in to Enroll"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatINR(course.final_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className={discount > 0 ? "text-green-600" : undefined}>
                          {discount > 0 ? `- ${formatINR(discount)}` : formatINR(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({course.tax_percent}%)</span>
                        <span>+ {formatINR(tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{formatINR(total)}</span>
                      </div>
                    </div>
                    <LoadingButton
                      className="w-full bg-green-600 hover:bg-green-700"
                      loading={isPaying}
                      onClick={handlePayment}
                    >
                      <Icon name="lock" className="size-4" />
                      {user ? `Pay ${formatINR(total)}` : "Log in to Purchase"}
                    </LoadingButton>
                    <p className="text-center text-xs text-muted-foreground">Secure payment processed by Razorpay</p>
                  </>
                )}
                {!user && (
                  <p className="text-center text-xs text-muted-foreground">
                    <Link href={ROUTES.LOGIN} className="underline">Sign in</Link> to complete your purchase.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
