"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import { COUNTRIES } from "@/lib/countries";

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

interface StripeFormProps {
  amount: number;
  orderNumber: string;
  onSuccess: (orderNumber: string) => void;
  onBack: () => void;
  /**
   * When provided (delivery + "use same address for billing" ticked),
   * the Stripe PaymentElement is told not to collect billing address again
   * and the address is passed directly to confirmPayment.
   * When null/undefined the gateway collects it as usual.
   */
  billingAddress?: BillingAddress | null;
}

export default function StripeForm({
  amount,
  orderNumber,
  onSuccess,
  onBack,
  billingAddress,
}: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currency } = siteConfig;

  // Manual billing address form — used when the customer has NOT ticked
  // "use same address for billing". We collect it ourselves so we can
  // pass every field to Stripe regardless of country-specific field rules.
  const [manualBilling, setManualBilling] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "MT",
  });

  const updateBilling = (field: keyof typeof manualBilling, value: string) =>
    setManualBilling((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // Resolve which billing address to use:
    // - ticked → use the delivery address passed as prop
    // - unticked → use the manual form the customer filled in
    const resolvedBilling = billingAddress ?? {
      line1: manualBilling.line1,
      line2: manualBilling.line2,
      city: manualBilling.city,
      postcode: manualBilling.postcode,
      country: manualBilling.country,
    };

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: billingAddress ? undefined : manualBilling.name,
            address: {
              line1: resolvedBilling.line1,
              line2: resolvedBilling.line2 ?? "",
              city: resolvedBilling.city,
              state: "",
              postal_code: resolvedBilling.postcode,
              country: resolvedBilling.country,
            },
          },
        },
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "An unknown error occurred.");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(orderNumber);
    } else {
      onSuccess(orderNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Manual billing address form — shown only when unticked.
          We collect every field ourselves so Stripe receives a complete
          billing_details object regardless of country-specific field rules. */}
      {!billingAddress && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm font-medium">Billing address</p>
          <div className="space-y-2">
            <Label htmlFor="sb-name">Full name</Label>
            <Input
              id="sb-name"
              value={manualBilling.name}
              onChange={(e) => updateBilling("name", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-line1">Address line 1</Label>
            <Input
              id="sb-line1"
              value={manualBilling.line1}
              onChange={(e) => updateBilling("line1", e.target.value)}
              placeholder="Street address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-line2">Address line 2</Label>
            <Input
              id="sb-line2"
              value={manualBilling.line2}
              onChange={(e) => updateBilling("line2", e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sb-city">City</Label>
              <Input
                id="sb-city"
                value={manualBilling.city}
                onChange={(e) => updateBilling("city", e.target.value)}
                placeholder="City"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-postcode">Postcode</Label>
              <Input
                id="sb-postcode"
                value={manualBilling.postcode}
                onChange={(e) => updateBilling("postcode", e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={manualBilling.country}
              onValueChange={(v) => updateBilling("country", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Always suppress Stripe's built-in address fields — we handle billing
          ourselves in all cases (manual form or pre-filled from delivery). */}
      <PaymentElement
        options={{
          fields: {
            billingDetails: { address: "never" },
          },
        }}
      />

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <Button type="submit" size="lg" disabled={!stripe || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>Pay {formatPrice(amount, currency.code, currency.locale)}</>
          )}
        </Button>
      </div>
    </form>
  );
}
