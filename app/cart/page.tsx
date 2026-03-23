"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { calcTotal } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useState, useEffect } from "react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal, getVatAmount, clearCart } =
    useCartStore();
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { currency } = siteConfig;

  const subtotal = getSubtotal();
  const vatAmount = getVatAmount();
  const total = calcTotal(subtotal, 0);

  const handleCheckout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    router.push(user ? "/checkout" : "/checkout-auth");
  };

  // Avoid hydration mismatch — Zustand rehydrates from localStorage only client-side
  // Render a consistent skeleton on both server and client until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-muted rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-muted-foreground/20 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Looks like you haven&apos;t added any items yet.
        </p>
        <Button size="xl" asChild>
          <Link href="/products">
            Browse Products <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.selectedOption}`}
              className="flex gap-4 p-4 rounded-lg border bg-card group"
            >
              <div className="h-24 w-24 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0 overflow-hidden relative">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.selectedOption && (
                      <p className="text-sm text-muted-foreground">
                        {siteConfig.filters.optionSelector}: {item.selectedOption}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => removeItem(item.productId, item.selectedOption)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.selectedOption, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.selectedOption, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-bold">
                    {formatPrice(item.pricePerUnit * item.quantity, currency.code, currency.locale)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Order Notes */}
          <div className="space-y-2">
            <Label htmlFor="order-notes">Order Notes (optional)</Label>
            <Textarea
              id="order-notes"
              placeholder="Any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Order Summary</h2>

            {/* Discount code */}
            <div className="flex gap-2">
              <Input
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                aria-label="Discount code"
              />
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal, currency.code, currency.locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                    VAT ({(siteConfig.vatRate * 100).toFixed(0)}%{siteConfig.vatIncluded ? " incl." : ""})
                </span>
                <span>{formatPrice(vatAmount, currency.code, currency.locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, currency.code, currency.locale)}</span>
            </div>

            <Button size="xl" className="w-full" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
