/**
 * SumUp Gateway Module — SCAFFOLD
 * ─────────────────────────────────
 * TODO: Implement full SumUp Checkout integration.
 * Required env vars:
 *   - SUMUP_CLIENT_ID
 *   - SUMUP_CLIENT_SECRET
 *   - SUMUP_MERCHANT_CODE
 *
 * SumUp docs: https://developer.sumup.com/api
 *
 * Steps to implement:
 *   1. Authenticate with SumUp OAuth2 (client_credentials)
 *   2. Implement createSumUpCheckout() below
 *   3. Create a UI component at components/checkout/SumUpForm.tsx
 *   4. Add the "SUMUP" case in app/api/checkout/route.ts
 *   5. Set enabled: true in site.config.ts → payments.sumUp
 */

export const SUM_UP_ENV_VARS = [
  "SUMUP_CLIENT_ID",
  "SUMUP_CLIENT_SECRET",
  "SUMUP_MERCHANT_CODE",
] as const;

export interface CreateSumUpCheckoutParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
  returnUrl: string;
}

/**
 * @throws Not yet implemented
 */
export async function createSumUpCheckout(
  _params: CreateSumUpCheckoutParams
): Promise<{ checkoutId: string; checkoutUrl: string }> {
  throw new Error("SumUp gateway is not yet implemented.");
}
