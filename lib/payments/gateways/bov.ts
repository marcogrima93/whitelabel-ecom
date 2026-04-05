/**
 * Bank of Valletta (BOV) Gateway Module — SCAFFOLD
 * ──────────────────────────────────────────────────
 * TODO: Implement full BOV payment integration.
 * Required env vars:
 *   - BOV_MERCHANT_ID
 *   - BOV_API_KEY
 *   - BOV_SECRET
 *
 * Steps to implement:
 *   1. Obtain BOV merchant integration docs from Bank of Valletta
 *   2. Implement createBovPaymentSession() below
 *   3. Create a UI component at components/checkout/BovForm.tsx
 *   4. Add the "BOV" case in app/api/checkout/route.ts
 *   5. Set enabled: true in site.config.ts → payments.bov
 */

export const BOV_ENV_VARS = [
  "BOV_MERCHANT_ID",
  "BOV_API_KEY",
  "BOV_SECRET",
] as const;

export interface CreateBovPaymentSessionParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
}

/**
 * @throws Not yet implemented
 */
export async function createBovPaymentSession(
  _params: CreateBovPaymentSessionParams
): Promise<{ sessionId: string }> {
  throw new Error("BOV gateway is not yet implemented.");
}
