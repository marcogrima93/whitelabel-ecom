/**
 * Mollie Gateway Module — SCAFFOLD
 * ──────────────────────────────────
 * TODO: Implement full Mollie integration.
 * Required env vars:
 *   - MOLLIE_API_KEY
 *
 * Mollie docs: https://docs.mollie.com
 *
 * Steps to implement:
 *   1. Install @mollie/api-client: pnpm add @mollie/api-client
 *   2. Implement createMolliePayment() below
 *   3. Create a UI component at components/checkout/MollieForm.tsx
 *   4. Add the "MOLLIE" case in app/api/checkout/route.ts
 *   5. Set enabled: true in site.config.ts → payments.mollie
 */

export const MOLLIE_ENV_VARS = ["MOLLIE_API_KEY"] as const;

export interface CreateMolliePaymentParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
  redirectUrl: string;
  webhookUrl: string;
}

/**
 * @throws Not yet implemented
 */
export async function createMolliePayment(
  _params: CreateMolliePaymentParams
): Promise<{ checkoutUrl: string; paymentId: string }> {
  throw new Error("Mollie gateway is not yet implemented.");
}
