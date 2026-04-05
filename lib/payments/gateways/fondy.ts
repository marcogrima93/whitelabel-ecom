/**
 * Fondy Gateway Module — SCAFFOLD
 * ─────────────────────────────────
 * TODO: Implement full Fondy (now Tranzzo) integration.
 * Required env vars:
 *   - FONDY_MERCHANT_ID
 *   - FONDY_SECRET_KEY
 *
 * Fondy docs: https://docs.fondy.eu
 *
 * Steps to implement:
 *   1. Implement createFondyOrder() below using Fondy REST API
 *   2. Create a UI component at components/checkout/FondyForm.tsx
 *   3. Add the "FONDY" case in app/api/checkout/route.ts
 *   4. Set enabled: true in site.config.ts → payments.fondy
 */

export const FONDY_ENV_VARS = [
  "FONDY_MERCHANT_ID",
  "FONDY_SECRET_KEY",
] as const;

export interface CreateFondyOrderParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
  responseUrl: string;
}

/**
 * @throws Not yet implemented
 */
export async function createFondyOrder(
  _params: CreateFondyOrderParams
): Promise<{ checkoutUrl: string; orderId: string }> {
  throw new Error("Fondy gateway is not yet implemented.");
}
