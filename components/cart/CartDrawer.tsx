"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { calcTotal } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { DiscountInput } from "@/components/cart/DiscountInput";

interface CartDrawerProps {
  onClose: () => void;
}

export function CartDrawer({ onClose }: CartDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const discountCode = useCartStore((s) => s.discountCode);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discountAmount = useCartStore((s) => s.getDiscountAmount());
  const vatAmount = useCartStore((s) => s.getVatAmount());
  const total = calcTotal(subtotal - discountAmount, 0);
  const { currency } = siteConfig;

  const handleCheckout = async () => {
    onClose();
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/checkout");
    } else {
      router.push("/checkout-auth");
    }
  };

  if (items.length === 0) {
    return (
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>Your cart is empty</SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add some products to get started
            </p>
          </div>
          <Button onClick={onClose} asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </SheetContent>
    );
  }

  return (
    <SheetContent className="flex flex-col">
      <SheetHeader>
        <SheetTitle>Your Cart ({getItemCount()} items)</SheetTitle>
        <SheetDescription>Review your items before checkout</SheetDescription>
      </SheetHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {items.map((item) => (
          <CartItemRow
            key={`${item.productId}-${item.selectedOption}`}
            item={item}
            currency={currency}
            onRemove={() => removeItem(item.productId, item.selectedOption)}
            onUpdateQty={(qty) =>
              updateQuantity(item.productId, item.selectedOption, qty)
            }
          />
        ))}
      </div>

      <Separator />

      {/* Discount code input */}
      <div className="py-3">
        <DiscountInput />
      </div>

      {/* Totals */}
      <div className="space-y-2 pb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal, currency.code, currency.locale)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Discount ({discountCode})</span>
            <span>-{formatPrice(discountAmount, currency.code, currency.locale)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            VAT ({(siteConfig.vatRate * 100).toFixed(0)}%{siteConfig.vatIncluded ? " incl." : ""})
          </span>
          <span>{formatPrice(vatAmount, currency.code, currency.locale)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{formatPrice(total, currency.code, currency.locale)}</span>
        </div>
      </div>

      {/* Wholesale minimum order warning */}
      {siteConfig.wholesale.enabled &&
        subtotal < siteConfig.wholesale.minOrderValue && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
            Wholesale minimum order: {formatPrice(siteConfig.wholesale.minOrderValue, currency.code, currency.locale)}
          </p>
        )}

      <SheetFooter className="flex-col gap-2 sm:flex-col">
        <Button className="w-full" size="lg" onClick={handleCheckout}>
          Proceed to Checkout
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/cart" onClick={onClose}>View Cart</Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            if (pathname === "/products") {
              onClose();
            } else {
              onClose();
              router.push("/products");
            }
          }}
        >
          Continue Shopping
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

function CartItemRow({
  item,
  currency,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  currency: typeof siteConfig.currency;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  return (
    <div className="flex gap-3 group">
      {/* Image */}
      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted shrink-0">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:underline line-clamp-1">
          {item.name}
        </Link>
        {item.selectedOption && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.selectedOption}
          </p>
        )}
        <p className="text-sm font-semibold mt-1">
          {formatPrice(item.pricePerUnit, currency.code, currency.locale)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQty(item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQty(item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
