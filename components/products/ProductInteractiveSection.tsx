"use client";

import { useState, useCallback } from "react";
import type { Product, OptionConfig } from "@/lib/supabase/types";
import { ProductImageGallery } from "./ProductImageGallery";
import { AddToCartSection } from "./AddToCartSection";

interface Props {
  product: Product;
}

/**
 * Client shell that owns the selected-option state shared between the image
 * gallery and the add-to-cart panel.  Both price override and image link react
 * to option selection without any page reload or layout shift — all images are
 * already present in the gallery thumbnail set.
 */
export function ProductInteractiveSection({ product }: Props) {
  const configs: OptionConfig[] = Array.isArray(product.option_configs)
    ? product.option_configs
    : [];

  /** Resolve the OptionConfig for the currently selected option value, if any. */
  const getConfig = useCallback(
    (option: string) => configs.find((c) => c.value === option) ?? null,
    [configs]
  );

  const firstOption = product.options[0] ?? "";
  const initialConfig = getConfig(firstOption);

  // Resolve the active image index from a config's image_url
  const imageIndexFor = useCallback(
    (cfg: OptionConfig | null): number => {
      if (!cfg?.image_url) return 0;
      const idx = product.images.indexOf(cfg.image_url);
      return idx >= 0 ? idx : 0;
    },
    [product.images]
  );

  const [activeImageIndex, setActiveImageIndex] = useState<number>(
    imageIndexFor(initialConfig)
  );
  const [resolvedPrice, setResolvedPrice] = useState<number>(
    initialConfig?.price_override ?? product.retail_price
  );

  const handleOptionChange = useCallback(
    (option: string) => {
      const cfg = getConfig(option);
      // Update price: use override if set, otherwise fall back to base price
      setResolvedPrice(cfg?.price_override ?? product.retail_price);
      // Update image: use linked image if set, otherwise show first image
      setActiveImageIndex(imageIndexFor(cfg));
    },
    [getConfig, imageIndexFor, product.retail_price]
  );

  const handleThumbnailSelect = useCallback((index: number) => {
    setActiveImageIndex(index);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Image Gallery */}
      <ProductImageGallery
        images={product.images}
        name={product.name}
        activeIndex={activeImageIndex}
        onSelect={handleThumbnailSelect}
      />

      {/* Right: Product Info + Add to Cart */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <p className="text-muted-foreground mb-6">{product.description}</p>
        <AddToCartSection
          product={product}
          resolvedPrice={resolvedPrice}
          onOptionChange={handleOptionChange}
        />
      </div>
    </div>
  );
}
