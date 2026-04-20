"use client";

/**
 * RevolutForm — Revolut Checkout embedded widget.
 *
 * Uses RevolutCheckout.embeddedCheckout() per:
 * https://developer.revolut.com/docs/guides/accept-payments/online-payments/revolut-checkout/web
 *
 * Flow:
 *  1. On mount: call embeddedCheckout() with publicToken + mode + target div.
 *  2. createOrder callback: POST to /api/checkout/revolut/create-order → get token → return { publicId: token }
 *  3. onSuccess / onError / onCancel handle payment results.
 */

import { useEffect, useRef, useState } from "react";
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
const revolutMode =
  (process.env.NEXT_PUBLIC_REVOLUT_MODE as "sandbox" | "prod") ?? "sandbox";

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
  const destroyRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!revolutPublicToken) {
      setError(
        "Revolut Checkout is not configured. Set NEXT_PUBLIC_REVOLUT_PUBLIC_ID."
      );
      setLoading(false);
      return;
    }

    // Destroy any previous instance (React StrictMode double-invoke safety)
    if (destroyRef.current) {
      destroyRef.current();
      destroyRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    let cancelled = false;

    async function initCheckout() {
      try {
        const RevolutCheckout = (await import("@revolut/checkout")).default;

        const { destroy } = await RevolutCheckout.embeddedCheckout({
          mode: revolutMode,
          publicToken: revolutPublicToken,
          locale: "auto",
          target: containerRef.current!,

          createOrder: async () => {
            const res = await fetch("/api/checkout/revolut/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderNumber,
                total: amount,
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

          ...(customerEmail ? { email: customerEmail } : {}),

          onSuccess(_payload: { orderId: string }) {
            if (!cancelled) onSuccess(orderNumber);
          },

          onError(payload: { error: { message?: string }; orderId: string }) {
            if (!cancelled)
              setError(
                payload?.error?.message ?? "An error occurred during payment."
              );
          },

          onCancel(_payload: { orderId: string | undefined }) {
            if (!cancelled) setError("Payment was cancelled.");
          },
        });

        if (cancelled) {
          destroy();
          return;
        }

        destroyRef.current = destroy;
        setLoading(false);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialise Revolut Checkout."
          );
          setLoading(false);
        }
      }
    }

    initCheckout();

    return () => {
      cancelled = true;
      destroyRef.current?.();
      destroyRef.current = null;
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
        Revolut Checkout is not configured. Set NEXT_PUBLIC_REVOLUT_PUBLIC_ID.
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

      {loading && !error && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Revolut embeddedCheckout mounts the full widget here */}
      <div ref={containerRef} className={loading && !error ? "hidden" : ""} />

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
