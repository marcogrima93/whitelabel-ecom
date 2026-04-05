"use client";

/**
 * PayPalForm — Checkout UI component for PayPal gateway.
 * Uses @paypal/react-paypal-js for the hosted PayPal buttons.
 *
 * Props match StripeForm so both components are interchangeable in the
 * checkout page's payment step renderer.
 */

import { useState } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";

interface PayPalFormProps {
  amount: number;
  orderNumber: string;
  /** Called with the internal order number once payment is captured */
  onSuccess: (orderNumber: string) => void;
  onBack: () => void;
}

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

/** Inner component — must be rendered inside PayPalScriptProvider */
function PayPalButtonsInner({
  amount,
  orderNumber,
  onSuccess,
  onBack,
}: PayPalFormProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const { currency } = siteConfig;

  const createOrder = async (): Promise<string> => {
    setError(null);
    const res = await fetch("/api/checkout/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to create PayPal order.");
    }

    const data = await res.json();
    return data.paypalOrderId as string;
  };

  const onApprove = async (data: { orderID: string }) => {
    setError(null);
    try {
      const res = await fetch("/api/checkout/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          orderNumber,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "PayPal capture failed.");
      }

      onSuccess(orderNumber);
    } catch (err: any) {
      setError(err.message ?? "An error occurred during PayPal payment.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Total:{" "}
        <span className="font-semibold text-foreground">
          {formatPrice(amount, currency.code, currency.locale)}
        </span>
      </div>

      {isPending && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && (
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            setError(
              typeof err === "string" ? err : "An unexpected PayPal error occurred."
            );
          }}
          onCancel={() => setError("Payment was cancelled.")}
        />
      )}

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

/** Public component — wraps the inner component with PayPalScriptProvider */
export default function PayPalForm(props: PayPalFormProps) {
  if (!paypalClientId) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive p-4 border border-destructive/30 rounded-lg">
        <AlertCircle className="h-4 w-4 shrink-0" />
        PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: siteConfig.currency.code.toUpperCase(),
        intent: "capture",
      }}
    >
      <PayPalButtonsInner {...props} />
    </PayPalScriptProvider>
  );
}
