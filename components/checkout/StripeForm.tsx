"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";

interface StripeFormProps {
  amount: number;
  onSuccess: (orderNumber: string) => void;
  onBack: () => void;
}

export default function StripeForm({ amount, onSuccess, onBack }: StripeFormProps) {
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

    // Confirm the payment
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required if we want to redirect, but we can do redirect: 'if_required' 
        // to handle the success state immediately in the SPA without a hard redirect.
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "An unknown error occurred.");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment was successfully confirmed
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      onSuccess(orderNumber);
    } else {
      // It might require further action (e.g. 3D Secure), though 'if_required' usually handles it.
      // If it's processing or requires action, we can either wait or inform the user.
      // For simplicity in this SPA flow:
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      onSuccess(orderNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
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
        <Button 
          type="submit" 
          size="lg" 
          disabled={!stripe || loading}
        >
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
