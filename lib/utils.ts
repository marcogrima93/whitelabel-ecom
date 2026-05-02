import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "EUR", locale = "en-MT") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

/**
 * Derives a human-readable payment gateway label from the stored
 * stripe_payment_intent_id value (which is reused for all gateway references).
 *
 * Convention:
 *  - null / undefined              → "Cash"
 *  - starts with "paypal_capture_" → "PayPal"
 *  - starts with "revolut_"        → "Revolut Pay"
 *  - starts with "tr_"             → "Mollie"
 *  - starts with "pi_"             → "Stripe"
 *  - anything else                 → "Online Payment"
 */
export function getPaymentGatewayLabel(paymentIntentId: string | null | undefined): string {
  if (!paymentIntentId) return "Cash";
  if (paymentIntentId.startsWith("paypal_capture_")) return "PayPal";
  if (paymentIntentId.startsWith("revolut_")) return "Revolut Pay";
  if (paymentIntentId.startsWith("tr_")) return "Mollie";
  if (paymentIntentId.startsWith("pi_")) return "Stripe";
  // Fallback covers any future gateways or unexpected formats
  return "Online Payment";
}
