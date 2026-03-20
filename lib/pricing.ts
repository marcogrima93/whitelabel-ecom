// ============================================================================
// Pricing Utility — Tiered wholesale pricing
// ============================================================================

import { siteConfig } from "@/site.config";
import type { Product, Profile } from "@/lib/supabase/types";

interface PriceResult {
  price: number;
  isWholesale: boolean;
  tierLabel: string | null;
  originalRetailPrice: number;
}

export function getPriceForUser(
  product: Product,
  user: Profile | null,
  quantity: number = 1
): PriceResult {
  const isWholesale =
    user?.role === "WHOLESALE" && user?.wholesale_approved === true;

  if (!isWholesale) {
    return {
      price: product.retail_price,
      isWholesale: false,
      tierLabel: null,
      originalRetailPrice: product.retail_price,
    };
  }

  // Find applicable tier (highest matching)
  let basePrice = product.wholesale_price;
  let tierLabel: string | null = "Wholesale";

  const sortedTiers = [...siteConfig.wholesale.tiers].sort(
    (a, b) => b.minQty - a.minQty
  );

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQty) {
      basePrice = product.wholesale_price * tier.multiplier;
      tierLabel = tier.label;
      break;
    }
  }

  return {
    price: Math.round(basePrice * 100) / 100,
    isWholesale: true,
    tierLabel,
    originalRetailPrice: product.retail_price,
  };
}

export function formatVatNote(): string {
  const pct = (siteConfig.vatRate * 100).toFixed(0);
  return `Price includes ${pct}% VAT`;
}
