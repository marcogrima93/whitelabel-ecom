import { siteConfig } from "../../../../site.config";

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function getStockStatus(count: number): { label: string; color: string } {
  if (count <= 0) return { label: "Out of Stock", color: "destructive" };
  if (count <= 5) return { label: "Low Stock", color: "warning" };
  return { label: "In Stock", color: "success" };
}

export function calculateTax(subtotal: number): number {
  if (siteConfig.tax.included) {
    // Price includes tax — extract tax from total
    return subtotal - subtotal / (1 + siteConfig.tax.rate);
  }
  return subtotal * siteConfig.tax.rate;
}

export function calculateShipping(subtotal: number, region?: string): number {
  if (subtotal >= siteConfig.shipping.freeThreshold) return 0;
  const rate = siteConfig.shipping.rates.find((r) => r.region === region);
  return rate?.fee ?? siteConfig.shipping.rates[0]?.fee ?? 0;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
