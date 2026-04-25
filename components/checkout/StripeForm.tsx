"use client";

import { useState } from "react";
import {
  AddressElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // When the customer ticked "use same address for billing" we hide the
        // address fields in the widget and must supply billing_details ourselves.
        // When unticked, Stripe collects the full address via the widget — no
        // need to pass anything here.
        ...(billingAddress
          ? {
              payment_method_data: {
                billing_details: {
                  address: {
                    line1: billingAddress.line1,
                    line2: billingAddress.line2 ?? "",
                    city: billingAddress.city,
                    state: billingAddress.county ?? "",
                    postal_code: billingAddress.postcode,
                    country: billingAddress.country,
                  },
                },
              },
            }
          : {}),
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
      {/*
       * When billing checkbox is NOT ticked (billingAddress is null):
       *   Render a separate AddressElement in "billing" mode. This is the only
       *   Stripe-supported way to force full address collection (line1, city,
       *   postcode, country). It auto-attaches to confirmPayment — no extra
       *   code needed at confirm time.
       *
       * When billing checkbox IS ticked (billingAddress is set):
       *   Hide address fields on PaymentElement entirely ("never") and supply
       *   the delivery address ourselves via confirmPayment billing_details.
       */}
      {!billingAddress && (
        <AddressElement options={{ mode: "billing" }} />
      )}

      <PaymentElement
        options={
          billingAddress
            ? {
                fields: {
                  billingDetails: { address: "never" },
                },
              }
            : undefined
        }
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
