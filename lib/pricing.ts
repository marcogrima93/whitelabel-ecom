// ============================================================================
// Pricing Utility — Tiered wholesale pricing + VAT helpers
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

// ── VAT helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the VAT amount for a given subtotal and optional delivery fee.
 *
 * vatIncluded = true  → prices (and delivery) already include VAT; back-calculate
 *   from the combined grand total:
 *   vatAmount = grandTotal − grandTotal / (1 + rate)
 *   where grandTotal = subtotal + deliveryFee
 *
 * vatIncluded = false → prices are ex-VAT; VAT is additive on the combined net:
 *   vatAmount = (subtotal + deliveryFee) × rate
 */
export function calcVatAmount(subtotal: number, deliveryFee: number = 0): number {
  const combined = subtotal + deliveryFee;
  if (siteConfig.vatIncluded) {
    return combined - combined / (1 + siteConfig.vatRate);
  }
  return combined * siteConfig.vatRate;
}

/**
 * Grand total charged to the customer.
 *   vatIncluded → subtotal + deliveryFee   (VAT already baked into both)
 *   vatExcluded → subtotal + deliveryFee + VAT on combined net
 */
export function calcTotal(subtotal: number, deliveryFee: number): number {
  if (siteConfig.vatIncluded) {
    return subtotal + deliveryFee;
  }
  return subtotal + deliveryFee + calcVatAmount(subtotal, deliveryFee);
}

export function formatVatNote(): string {
  const pct = (siteConfig.vatRate * 100).toFixed(0);
  return siteConfig.vatIncluded
    ? `Price includes ${pct}% VAT`
    : `${pct}% VAT will be added at checkout`;
}
