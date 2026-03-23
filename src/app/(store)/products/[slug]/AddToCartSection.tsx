"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuantitySelector } from "@/modules/ecom/components/QuantitySelector";
import { useCart } from "@/modules/ecom/hooks/use-cart";
import type { ProductWithDetails } from "@/types/database";

export function AddToCartSection({ product }: { product: ProductWithDetails }) {
  const [selectedVariant, setSelectedVariant] = useState(product.product_variants?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((s) => s.addItem);

  const variant = product.product_variants?.find((v) => v.id === selectedVariant);
  const price = variant?.price || product.price;
  const primaryImage = product.product_images?.find((i) => i.is_primary) || product.product_images?.[0];

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantName: variant?.name,
      image: primaryImage?.url || "/placeholder-product.svg",
      price,
      quantity,
      sku: variant?.sku || product.sku || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {product.product_variants && product.product_variants.length > 0 && (
        <div>
          <Label className="mb-2 block">Options</Label>
          <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant} className="flex flex-wrap gap-2">
            {product.product_variants.map((v) => (
              <div key={v.id}>
                <RadioGroupItem value={v.id} id={v.id} className="peer sr-only" />
                <Label
                  htmlFor={v.id}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover px-3 py-2 text-sm cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  {v.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Quantity */}
      <div>
        <Label className="mb-2 block">Quantity</Label>
        <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.inventory_count} />
      </div>

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={product.inventory_count <= 0}
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {product.inventory_count <= 0 ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
