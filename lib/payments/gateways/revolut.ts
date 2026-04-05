/**
 * Revolut Gateway Module — SCAFFOLD
 * ───────────────────────────────────
 * TODO: Implement full Revolut Pay integration.
 * Required env vars:
 *   - REVOLUT_API_KEY
 *   - NEXT_PUBLIC_REVOLUT_PUBLIC_ID
 *
 * Revolut Pay docs: https://developer.revolut.com/docs/merchant/revolut-pay
 *
 * Steps to implement:
 *   1. Install any required Revolut SDK (or use plain fetch)
 *   2. Implement createRevolutOrder() below
 *   3. Create a UI component at components/checkout/RevolutForm.tsx
 *   4. Add the "REVOLUT" case in app/api/checkout/route.ts
 *   5. Set enabled: true in site.config.ts → payments.revolut
 */

export const REVOLUT_ENV_VARS = [
  "REVOLUT_API_KEY",
  "NEXT_PUBLIC_REVOLUT_PUBLIC_ID",
] as const;

export interface CreateRevolutOrderParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
}

/**
 * @throws Not yet implemented
 */
export async function createRevolutOrder(
  _params: CreateRevolutOrderParams
): Promise<{ orderId: string }> {
  throw new Error("Revolut gateway is not yet implemented.");
}
