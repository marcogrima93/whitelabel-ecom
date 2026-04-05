/**
 * Cash on Delivery Gateway Module
 * ─────────────────────────────────
 * No environment variables required.
 * This gateway creates the order immediately — no payment intent or
 * external API call is needed.
 *
 * UI: handled inline in app/checkout/page.tsx (COD spinner state)
 *
 * To add a new gateway: copy this file, implement the necessary server-side
 * logic, and register it in lib/payments/registry.ts and site.config.ts.
 */

export const CASH_ON_DELIVERY_ENV_VARS: string[] = [];

/**
 * No-op: COD requires no payment initialisation.
 * The order is created directly via createOrder() in the checkout API route.
 */
export function isCashOnDelivery(paymentMethod: string): boolean {
  return paymentMethod === "CASH";
}
