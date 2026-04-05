/**
 * myPOS Gateway Module — SCAFFOLD
 * ─────────────────────────────────
 * TODO: Implement full myPOS Checkout integration.
 * Required env vars:
 *   - MYPOS_STORE_ID
 *   - MYPOS_CLIENT_ID
 *   - MYPOS_API_PASSWORD
 *
 * myPOS docs: https://developers.mypos.com
 *
 * Steps to implement:
 *   1. Implement createMyPosOrder() below
 *   2. Create a UI component at components/checkout/MyPosForm.tsx
 *   3. Add the "MYPOS" case in app/api/checkout/route.ts
 *   4. Set enabled: true in site.config.ts → payments.myPos
 */

export const MY_POS_ENV_VARS = [
  "MYPOS_STORE_ID",
  "MYPOS_CLIENT_ID",
  "MYPOS_API_PASSWORD",
] as const;

export interface CreateMyPosOrderParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

/**
 * @throws Not yet implemented
 */
export async function createMyPosOrder(
  _params: CreateMyPosOrderParams
): Promise<{ checkoutUrl: string; orderId: string }> {
  throw new Error("myPOS gateway is not yet implemented.");
}
