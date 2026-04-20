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

// ── Currency helpers ─────────────────────────────────────────────────────────

/**
 * Safely rounds a number to 2 decimal places, avoiding floating-point drift.
 * e.g. 104.97999999999999 → 104.98
 */
function roundCurrency(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a major-unit currency amount (e.g. €104.98) to its smallest
 * denomination (e.g. 10498 cents) **without** floating-point rounding errors.
 *
 * Uses string manipulation to avoid the classic `104.98 * 100 → 10497.999…`
 * problem that causes payment gateways to charge rounded-up amounts.
 *
 * Works for any two-decimal-place currency (EUR, USD, GBP …).
 */
export function toMinorUnits(amount: number): number {
  // First round to 2dp so we work with a clean value
  const rounded = roundCurrency(amount);
  // Use toFixed(2) to get an exact string, then strip the dot and parse
  const [whole, frac = "00"] = rounded.toFixed(2).split(".");
  return parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, "0"), 10);
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
    return roundCurrency(combined - combined / (1 + siteConfig.vatRate));
  }
  return roundCurrency(combined * siteConfig.vatRate);
}

/**
 * Grand total charged to the customer.
 *   vatIncluded → subtotal + deliveryFee   (VAT already baked into both)
 *   vatExcluded → subtotal + deliveryFee + VAT on combined net
 */
export function calcTotal(subtotal: number, deliveryFee: number): number {
  if (siteConfig.vatIncluded) {
    return roundCurrency(subtotal + deliveryFee);
  }
  return roundCurrency(subtotal + deliveryFee + calcVatAmount(subtotal, deliveryFee));
}

export function formatVatNote(): string {
  const pct = (siteConfig.vatRate * 100).toFixed(0);
  return siteConfig.vatIncluded
    ? `Price includes ${pct}% VAT`
    : `${pct}% VAT will be added at checkout`;
}
