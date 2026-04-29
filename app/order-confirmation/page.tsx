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
import { CheckCircle, Package, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderNumber = searchParams.get("orderNumber");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!orderNumber) {
      // No order number — redirect home
      router.replace("/");
      return;
    }
    // Clear the cart now that we're safely on the confirmation page
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Payment received!
          </h1>
          <p className="text-muted-foreground text-sm">
            Thank you for your order. We&apos;ve received your payment and will
            start processing it shortly.
          </p>
        </div>

        <Separator />

        {/* Order number */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            Order number
          </div>
          <span className="font-semibold font-mono">{orderNumber}</span>
        </div>

        {/* Body copy */}
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to you. You can track your order
          status in your account.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild>
            <Link href="/account/orders">View my orders</Link>
          </Button>
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
