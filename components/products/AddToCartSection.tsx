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
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock_status === "OUT_OF_STOCK";

  const handleOptionSelect = (opt: string) => {
    setSelectedOption(opt);
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
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stockBadge = () => {
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
            {product.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionSelect(opt)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                  selectedOption === opt
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-input"
                }`}
              >
                {opt}
              </button>
            ))}
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
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
