"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart } from "@/modules/ecom/hooks/use-cart";
import { formatPrice, calculateTax, calculateShipping } from "@/modules/ecom/lib/utils";
import { siteConfig } from "../../../../site.config";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount, clearCart } = useCart();
  const subtotal = getSubtotal();
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping(subtotal);
  const total = siteConfig.tax.included ? subtotal + shipping : subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Browse our products and add items to your cart.</p>
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart ({getItemCount()} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4 border rounded-lg">
              <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.name}</h3>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                <p className="font-semibold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="ml-auto font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.productId, item.variantId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={clearCart}>Clear Cart</Button>
        </div>

        {/* Order Summary */}
        <div className="border rounded-lg p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {!siteConfig.tax.included && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{siteConfig.tax.label}</span>
                <span>{formatPrice(tax)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>

            {siteConfig.features.discountCodes && (
              <div className="flex gap-2 pt-2">
                <Input placeholder="Discount code" className="h-9" />
                <Button variant="outline" size="sm">Apply</Button>
              </div>
            )}

            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {siteConfig.tax.included && (
              <p className="text-xs text-muted-foreground">
                Includes {formatPrice(tax)} {siteConfig.tax.label}
              </p>
            )}
          </div>
          <Link href="/checkout" className="block mt-4">
            <Button className="w-full" size="lg">Proceed to Checkout</Button>
          </Link>
          <Link href="/products" className="block mt-2">
            <Button variant="outline" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
