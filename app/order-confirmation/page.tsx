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
 * Derives UI copy from the Mollie payment status passed back in the redirect URL.
 *
 * paid        → confirmed, money received
 * authorized  → card authorised, capture pending — treat as success (money guaranteed)
 * open        → bank transfer / slow method still processing — show pending
 * pending     → same as open
 * failed      → payment failed — show failure message
 * canceled    → customer cancelled — show cancelled message
 * expired     → session expired — show cancelled message
 * (blank)     → unknown / direct navigation — treat as success (Stripe/PayPal path)
 */
type MollieStatus = "paid" | "authorized" | "open" | "pending" | "failed" | "canceled" | "expired" | "";

function getStatusConfig(status: MollieStatus) {
  switch (status) {
    case "failed":
    case "canceled":
    case "expired":
      return {
        icon: <XCircle className="h-10 w-10 text-destructive" />,
        iconBg: "bg-destructive/10",
        heading: status === "canceled" ? "Payment cancelled" : status === "expired" ? "Payment expired" : "Payment failed",
        body:
          status === "canceled"
            ? "You cancelled the payment. Your order has not been charged. You can try again or choose a different payment method."
            : status === "expired"
            ? "Your payment session expired before the payment was completed. Please try again."
            : "The payment could not be completed. No charge has been made. Please try again with a different payment method.",
        cta: "Try again",
        ctaHref: "/checkout",
        isFailure: true,
      };
    case "open":
    case "pending":
      return {
        icon: <Clock className="h-10 w-10 text-amber-500" />,
        iconBg: "bg-amber-500/10",
        heading: "Payment pending",
        body: "Your order has been placed and is awaiting payment confirmation. Some payment methods (e.g. bank transfer) can take a few days to settle. We will send you a confirmation email once payment is received.",
        cta: null,
        ctaHref: null,
        isFailure: false,
      };
    // paid, authorized, or blank (non-Mollie gateway)
    default:
      return {
        icon: <CheckCircle className="h-10 w-10 text-primary" />,
        iconBg: "bg-primary/10",
        heading: "Payment received!",
        body: "Thank you for your order. We have received your payment and will start processing it shortly. A confirmation email has been sent to you.",
        cta: null,
        ctaHref: null,
        isFailure: false,
      };
  }
}

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderNumber = searchParams.get("orderNumber");
  const rawStatus = (searchParams.get("status") ?? "") as MollieStatus;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!orderNumber) {
      router.replace("/");
      return;
    }
    // Always clear the cart — even on failed/cancelled, since the order was created
    // server-side. The customer would start a fresh checkout if they retry.
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

  const { icon, iconBg, heading, body, cta, ctaHref, isFailure } = getStatusConfig(rawStatus);

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

        <Separator />

        {/* Order number — show for non-failure statuses */}
        {!isFailure && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              Order number
            </div>
            <span className="font-semibold font-mono">{orderNumber}</span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          {cta && ctaHref ? (
            <Button asChild>
              <Link href={ctaHref}>{cta}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/account/orders">View my orders</Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue shopping
            </Link>
          </Button>
        </div>

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
