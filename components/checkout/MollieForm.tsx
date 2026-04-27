"use client";

/**
 * MollieForm — Redirects the customer to the Mollie hosted checkout page.
 *
 * Flow:
 *  1. On mount: POST to /api/checkout/mollie/create-payment with order details.
 *  2. Server returns a checkoutUrl — we redirect the browser there immediately.
 *  3. Mollie hosts the full card / iDEAL / Bancontact / etc. payment UI.
 *  4. On completion Mollie redirects back to /checkout?mollie_payment_id=tr_xxx&orderNumber=xxx
 *  5. The checkout page detects those params and calls onSuccess(orderNumber).
 *
 * Billing address:
 *  When billingAddress is provided (delivery + "same address for billing" ticked),
 *  it is forwarded to the Mollie Create Payment API so the hosted page can
 *  pre-fill the billing address fields.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import type { BillingAddress } from "@/components/checkout/StripeForm";

interface MollieFormProps {
  amount: number;
  orderNumber: string;
  customerEmail?: string;
  onSuccess: (orderNumber: string) => void;
  onBack: () => void;
  /**
   * When provided (delivery + "use same address for billing" ticked),
   * the address is forwarded to the Mollie create-payment API.
   */
  billingAddress?: BillingAddress | null;
}

export default function MollieForm({
  amount,
  orderNumber,
  customerEmail,
  onSuccess,
  onBack,
  billingAddress,
}: MollieFormProps) {
  const { currency } = siteConfig;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const initiated = useRef(false);

  useEffect(() => {
    // Prevent double-invoke (React StrictMode)
    if (initiated.current) return;
    initiated.current = true;

    async function startPayment() {
      try {
        const res = await fetch("/api/checkout/mollie/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            total: amount,
            currencyCode: currency.code.toUpperCase(),
            customerEmail,
            billingAddress: billingAddress
              ? {
                  line1: billingAddress.line1,
                  line2: billingAddress.line2,
                  city: billingAddress.city,
                  county: billingAddress.county,
                  postcode: billingAddress.postcode,
                  country: billingAddress.country,
                }
              : null,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.checkoutUrl) {
          throw new Error(data.error ?? "Failed to create Mollie payment.");
        }

        setLoading(false);
        setRedirecting(true);

        // Redirect the browser to the Mollie hosted checkout page
        window.location.href = data.checkoutUrl;
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialise Mollie Checkout."
        );
        setLoading(false);
      }
    }

    startPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Total:{" "}
        <span className="font-semibold text-foreground">
          {formatPrice(amount, currency.code, currency.locale)}
        </span>
      </div>

      {loading && !error && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preparing secure checkout...</p>
        </div>
      )}

      {redirecting && !error && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ExternalLink className="h-4 w-4" />
            Redirecting to secure payment page...
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            You are being redirected to Mollie&apos;s secure hosted checkout. Do not
            close this tab.
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={redirecting && !error}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
