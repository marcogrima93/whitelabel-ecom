"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/ecom/hooks/use-cart";
import { formatPrice } from "@/modules/ecom/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Order Summary</h2>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
            <span>{item.name} x {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(getSubtotal())}</span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting to payment...
            </>
          ) : (
            "Pay with Stripe"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You will be redirected to Stripe&apos;s secure checkout page.
        </p>
      </div>
    </div>
  );
}
