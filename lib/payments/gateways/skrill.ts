/**
 * Skrill Gateway Module — SCAFFOLD
 * ──────────────────────────────────
 * TODO: Implement full Skrill (Paysafe) integration.
 * Required env vars:
 *   - SKRILL_MERCHANT_EMAIL
 *   - SKRILL_SECRET_WORD
 *
 * Skrill docs: https://www.skrill.com/en/site/our-products/skrill-quick-checkout/
 *
 * Steps to implement:
 *   1. Implement createSkrillSession() below using Skrill Quick Checkout
 *   2. Create a UI component at components/checkout/SkrillForm.tsx
 *   3. Add the "SKRILL" case in app/api/checkout/route.ts
 *   4. Set enabled: true in site.config.ts → payments.skrill
 */

export const SKRILL_ENV_VARS = [
  "SKRILL_MERCHANT_EMAIL",
  "SKRILL_SECRET_WORD",
] as const;

export interface CreateSkrillSessionParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
}

/**
 * @throws Not yet implemented
 */
export async function createSkrillSession(
  _params: CreateSkrillSessionParams
): Promise<{ sessionId: string }> {
  throw new Error("Skrill gateway is not yet implemented.");
}
