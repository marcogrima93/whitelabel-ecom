"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product } from "@/lib/supabase/types";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";

interface AddToCartSectionProps {
  product: Product;
  /** Resolved price to display and snapshot into cart (override or base price). */
  resolvedPrice: number;
  /**
   * Resolved image URL to snapshot into the cart item at add-to-cart time.
   * If an option has a linked image it will be this value; otherwise falls back
   * to the first product image.
   */
  resolvedImage?: string;
  /** Called when the selected option changes, so the parent can react. */
  onOptionChange?: (option: string) => void;
}

export function AddToCartSection({ product, resolvedPrice, resolvedImage, onOptionChange }: AddToCartSectionProps) {
  const [selectedOption, setSelectedOption] = useState(product.options[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  // How many of this product+option combo are already sitting in the cart
  const cartQuantity = items
    .filter((i) => i.productId === product.id && i.selectedOption === selectedOption)
    .reduce((sum, i) => sum + i.quantity, 0);

  // Build a fast lookup from option value → stock_quantity (null = unlimited for that option)
  const optionStockMap = new Map<string, number | null>(
    (product.option_configs ?? []).map((c) => [c.value, c.stock_quantity ?? null])
  );

  const isLimited = product.stock_mode === "LIMITED";

  const hasPerOptionStock =
    isLimited &&
    product.options.length > 0 &&
    (product.option_configs ?? []).some((c) => c.stock_quantity !== null && c.stock_quantity !== undefined);

  const getOptionStock = (opt: string): number | null =>
    hasPerOptionStock ? (optionStockMap.get(opt) ?? null) : null;

  const isOptionOos = (opt: string) => {
    const qty = getOptionStock(opt);
    return qty !== null && qty <= 0;
  };

  // Compute max quantity for the currently selected option / product,
  // deducting whatever is already in the cart for this product+option.
  const maxQuantity = (() => {
    if (!isLimited) return 99;
    const rawStock = hasPerOptionStock
      ? (getOptionStock(selectedOption) ?? 99)
      : (product.stock_quantity !== undefined && product.stock_quantity !== null ? product.stock_quantity : 99);
    return Math.max(0, rawStock - cartQuantity);
  })();

  // Overall OOS: product-level flag, selected option is OOS, or no remaining stock after cart
  const isOutOfStock =
    product.stock_status === "OUT_OF_STOCK" ||
    (hasPerOptionStock && isOptionOos(selectedOption)) ||
    (isLimited && maxQuantity <= 0);

  const handleOptionSelect = (opt: string) => {
    if (isOptionOos(opt)) return;
    setSelectedOption(opt);
    setQuantity(1); // reset so cart-aware maxQuantity is recalculated cleanly
    onOptionChange?.(opt);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      // Snapshot the resolved image (linked option image or first product image)
      image: resolvedImage ?? product.images[0] ?? "",
      selectedOption,
      pricePerUnit: resolvedPrice,
      quantity,
      slug: product.slug,
    });
    setQuantity(1); // reset stepper to 1 after adding to cart
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stockBadge = () => {
    if (hasPerOptionStock) {
      const optQty = getOptionStock(selectedOption);
      if (optQty !== null) {
        if (optQty <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (optQty <= 2) return <Badge variant="warning">Low Stock — {optQty} left</Badge>;
        return <Badge variant="success">In Stock</Badge>;
      }
    }
    switch (product.stock_status) {
      case "IN_STOCK":
        return <Badge variant="success">In Stock</Badge>;
      case "LOW_STOCK":
        return <Badge variant="warning">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock */}
      <div>{stockBadge()}</div>

      {/* Price */}
      <div>
        <p className="text-3xl font-bold">
          {formatPrice(resolvedPrice, siteConfig.currency.code, siteConfig.currency.locale)}
          <span className="text-base font-normal text-muted-foreground ml-2">
            / {siteConfig.filters.unit}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Price includes {(siteConfig.vatRate * 100).toFixed(0)}% VAT
        </p>
      </div>

      {/* Option selector */}
      {product.options.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-2 block">
            {siteConfig.filters.optionSelector}
          </label>
          <div className="flex flex-wrap gap-2">
            {product.options.map((opt) => {
              const oos = isOptionOos(opt);
              const qty = getOptionStock(opt);
              return (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={oos}
                  className={`relative px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                    oos
                      ? "opacity-40 cursor-not-allowed bg-muted border-input text-muted-foreground line-through"
                      : selectedOption === opt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-input"
                  }`}
                  title={oos ? "Out of stock" : qty !== null && qty <= 2 ? `${qty} left` : undefined}
                >
                  {opt}
                  {!oos && qty !== null && qty <= 2 && qty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] leading-none bg-warning text-warning-foreground rounded-full px-1 py-0.5 font-semibold">
                      {qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Quantity</label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {isLimited && maxQuantity < 99 && maxQuantity > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {maxQuantity} {cartQuantity > 0 ? 'more' : ''} available{cartQuantity > 0 ? ` (${cartQuantity} in cart)` : ''}
          </p>
        )}
      </div>

      {/* Add to Cart */}
      <Button
        size="xl"
        className="w-full"
        disabled={isOutOfStock}
        onClick={handleAdd}
      >
        {added ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </>
        )}
      </Button>
      {isOutOfStock && (
        <p className="text-sm text-muted-foreground text-center">
          This product is currently out of stock.
        </p>
      )}

      {/* Request Quote Link */}
      {siteConfig.wholesale.enabled && (
        <a
          href="/wholesale/quote"
          className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors underline"
        >
          Need bulk pricing? Request a Quote
        </a>
      )}

      {/* Accordion tabs */}
      <Accordion type="single" collapsible className="w-full">
        {siteConfig.productAccordionTabs.map((tab) => (
          <AccordionItem key={tab.key} value={tab.key}>
            <AccordionTrigger>{tab.title}</AccordionTrigger>
            <AccordionContent>
              {tab.key === "description" ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Information about {tab.title.toLowerCase()} will be displayed here.
                  Configure per-product data in your Supabase database.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
