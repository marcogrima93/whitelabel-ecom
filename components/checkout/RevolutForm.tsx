"use client";

/**
 * RevolutForm — Checkout UI component for Revolut Pay.
 *
 * Uses @revolut/checkout to initialise the SDK with the public API key,
 * then mounts the official Revolut Pay button.
 *
 * Flow:
 *  1. On mount: initialise RevolutCheckout.payments() with the public token.
 *  2. createOrder callback: POST to /api/checkout/revolut/create-order with
 *     the internal orderNumber + totals so the server creates the Revolut order
 *     and returns the public `token`.
 *  3. Mount the Revolut Pay button into the #revolut-pay-container div.
 *  4. Listen to payment events and call onSuccess / display errors.
 */

import { useEffect, useRef, useState } from "react";
import type { RevolutCheckoutError, RevolutPayDropOffState } from "@revolut/checkout";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";

interface RevolutFormProps {
  amount: number;
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess: (orderNumber: string) => void;
  onBack: () => void;
}

const revolutPublicToken = process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_ID ?? "";

export default function RevolutForm({
  amount,
  orderNumber,
  customerEmail,
  customerName,
  onSuccess,
  onBack,
}: RevolutFormProps) {
  const { currency } = siteConfig;
  const containerRef = useRef<HTMLDivElement>(null);
  // destroyRef holds the cleanup fn returned by the SDK so we can call it on
  // unmount — this prevents the double-button issue caused by React StrictMode
  // running effects twice in development.
  const destroyRef = useRef<(() => void) | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!revolutPublicToken) {
      setError("Revolut Pay is not configured. Set NEXT_PUBLIC_REVOLUT_PUBLIC_ID.");
      return;
    }

    // Destroy any previously mounted instance (StrictMode double-invoke safety)
    if (destroyRef.current) {
      destroyRef.current();
      destroyRef.current = null;
      setSdkReady(false);
    }

    // Clear the container manually before re-mounting
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    let cancelled = false;

    async function initRevolut() {
      try {
        const RevolutCheckout = (await import("@revolut/checkout")).default;

        const { revolutPay } = await RevolutCheckout.payments({
          publicToken: revolutPublicToken,
          locale: "auto",
        });

        if (cancelled) {
          revolutPay.destroy();
          return;
        }

        const paymentOptions = {
          currency: currency.code.toUpperCase(),
          totalAmount: Math.round(amount),
          createOrder: async () => {
            const res = await fetch("/api/checkout/revolut/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderNumber,
                total: Math.round(amount),
                currencyCode: currency.code.toUpperCase(),
                customerEmail,
                customerName,
              }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error ?? "Failed to create Revolut order.");
            }
            const data = await res.json();
            return { publicId: data.token as string };
          },
          mobileRedirectUrls: {
            success: `${window.location.origin}/checkout?revolut=success`,
            failure: `${window.location.origin}/checkout?revolut=failure`,
            cancel: `${window.location.origin}/checkout?revolut=cancel`,
          },
        };

        if (containerRef.current && !cancelled) {
          // Clear the container again right before mounting in case of race
          containerRef.current.innerHTML = "";
          revolutPay.mount(containerRef.current, paymentOptions);
          destroyRef.current = () => revolutPay.destroy();
          setSdkReady(true);
        }

        type PaymentEvent =
          | { type: "success"; orderId: string }
          | { type: "error"; error: RevolutCheckoutError; orderId: string }
          | { type: "cancel"; dropOffState: RevolutPayDropOffState; orderId?: string };

        revolutPay.on("payment", (event: PaymentEvent) => {
          switch (event.type) {
            case "success":
              onSuccess(orderNumber);
              break;
            case "error":
              setError(event.error?.message ?? "An error occurred during payment.");
              break;
            case "cancel":
              if (event.dropOffState === "payment_summary") {
                setError("Payment was cancelled.");
              }
              break;
          }
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to initialise Revolut Pay.");
        }
      }
    }

    initRevolut();

    return () => {
      cancelled = true;
      if (destroyRef.current) {
        destroyRef.current();
        destroyRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!revolutPublicToken) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive p-4 border border-destructive/30 rounded-lg">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Revolut Pay is not configured. Set NEXT_PUBLIC_REVOLUT_PUBLIC_ID.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Total:{" "}
        <span className="font-semibold text-foreground">
          {formatPrice(amount, currency.code, currency.locale)}
        </span>
      </div>

      {!sdkReady && !error && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* The Revolut Pay button is mounted here by the SDK */}
      <div
        id="revolut-pay-container"
        ref={containerRef}
        className={sdkReady ? "min-h-[48px]" : "hidden"}
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
