"use client";

/**
 * /order-confirmation
 * ────────────────────
 * Standalone confirmation page used as the Mollie redirect-back URL.
 * Mollie redirects here after the customer completes (or cancels) payment.
 *
 * URL params:
 *   orderNumber — internal order reference (always present)
 *
 * The cart is cleared on mount so the customer can't accidentally re-order.
 * If the payment was cancelled/failed, Mollie's webhook will update the order
 * status to CANCELLED asynchronously — we show a "pending" message and let
 * the customer know they'll receive an email.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Package, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";

/**
 * All possible real Mollie payment statuses (from the API, not the URL).
 * "success" is our own internal sentinel for non-Mollie gateways (Stripe/PayPal).
 */
type MollieStatus =
  | "paid"
  | "authorized"
  | "open"
  | "pending"
  | "failed"
  | "canceled"
  | "expired"
  | "success"   // non-Mollie gateway path — always a success
  | "loading"   // waiting for API response
  | "error";    // API lookup failed

function getStatusConfig(status: MollieStatus) {
  switch (status) {
    case "loading":
      return {
        icon: <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />,
        iconBg: "bg-muted/50",
        heading: "Checking payment status…",
        body: "Please wait while we confirm your payment.",
        cta: null,
        ctaHref: null,
        isFailure: false,
        showOrderNumber: false,
      };

    case "failed":
    case "canceled":
    case "expired":
      return {
        icon: <XCircle className="h-10 w-10 text-destructive" />,
        iconBg: "bg-destructive/10",
        heading:
          status === "canceled"
            ? "Payment cancelled"
            : status === "expired"
            ? "Payment expired"
            : "Payment failed",
        body:
          status === "canceled"
            ? "You cancelled the payment. Your order has not been charged. Please return to checkout to try again."
            : status === "expired"
            ? "Your payment session timed out before completion. Please return to checkout to try again."
            : "The payment could not be completed. No charge has been made. Please try a different payment method.",
        cta: "Return to checkout",
        ctaHref: "/checkout",
        isFailure: true,
        showOrderNumber: false,
      };

    case "error":
      return {
        icon: <XCircle className="h-10 w-10 text-destructive" />,
        iconBg: "bg-destructive/10",
        heading: "Could not verify payment",
        body: "We were unable to confirm your payment status. If you believe the payment went through, please contact us with your order number.",
        cta: "Contact support",
        ctaHref: "/contact",
        isFailure: true,
        showOrderNumber: true,
      };

    case "open":
    case "pending":
      return {
        icon: <Clock className="h-10 w-10 text-amber-500" />,
        iconBg: "bg-amber-500/10",
        heading: "Payment pending",
        body: "Your order has been placed and is awaiting payment confirmation. Some methods (e.g. bank transfer) can take a few business days to settle. We will email you once payment is confirmed.",
        cta: null,
        ctaHref: null,
        isFailure: false,
        showOrderNumber: true,
      };

    // paid, authorized, success (non-Mollie gateways)
    default:
      return {
        icon: <CheckCircle className="h-10 w-10 text-primary" />,
        iconBg: "bg-primary/10",
        heading: "Payment received!",
        body: "Thank you for your order. We have received your payment and will start processing it shortly. A confirmation email has been sent to you.",
        cta: null,
        ctaHref: null,
        isFailure: false,
        showOrderNumber: true,
      };
  }
}

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderNumber = searchParams.get("orderNumber");
  // Mollie appends ?id=tr_xxx to the redirect URL automatically.
  // If there is no id param this is a non-Mollie gateway (Stripe/PayPal) — always success.
  const molliePaymentId = searchParams.get("id");

  const [status, setStatus] = useState<MollieStatus>(
    molliePaymentId ? "loading" : "success"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Look up the real payment status from Mollie via our server-side route.
  // This is the ONLY reliable way to know the outcome — URL params can't be trusted.
  useEffect(() => {
    if (!mounted || !molliePaymentId) return;

    fetch(`/api/mollie/payment-status?id=${encodeURIComponent(molliePaymentId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setStatus(data.status as MollieStatus);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [mounted, molliePaymentId]);

  useEffect(() => {
    if (!mounted) return;
    if (!orderNumber) {
      router.replace("/");
      return;
    }
    // Clear cart on mount. Even for failed/cancelled orders the server-side order
    // record was created — the customer starts a fresh checkout if they retry.
    clearCart();
  }, [mounted, orderNumber, clearCart, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orderNumber) return null;

  const { icon, iconBg, heading, body, cta, ctaHref, isFailure, showOrderNumber } =
    getStatusConfig(status);

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`rounded-full ${iconBg} p-4`}>{icon}</div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="text-muted-foreground text-sm">{body}</p>
        </div>

        {showOrderNumber && (
          <>
            <Separator />
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                Order number
              </div>
              <span className="font-semibold font-mono">{orderNumber}</span>
            </div>
          </>
        )}

        {/* Only show CTAs once we have a real status (not loading) */}
        {status !== "loading" && (
          <div className="flex flex-col gap-3 pt-2">
            {cta && ctaHref ? (
              <Button asChild>
                <Link href={ctaHref}>{cta}</Link>
              </Button>
            ) : (
              !isFailure && (
                <Button asChild>
                  <Link href="/account/orders">View my orders</Link>
                </Button>
              )
            )}
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue shopping
              </Link>
            </Button>
          </div>
        )}

        {/* Branding */}
        {siteConfig.shopName && (
          <p className="text-xs text-muted-foreground pt-2">
            {siteConfig.shopName}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
