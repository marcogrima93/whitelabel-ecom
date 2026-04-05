/**
 * Trust Payments Gateway Module — SCAFFOLD
 * ──────────────────────────────────────────
 * TODO: Implement full Trust Payments integration.
 * Required env vars:
 *   - TRUST_PAYMENTS_SITE_REFERENCE
 *   - TRUST_PAYMENTS_USERNAME
 *   - TRUST_PAYMENTS_PASSWORD
 *
 * Trust Payments docs: https://docs.trustpayments.com
 *
 * Steps to implement:
 *   1. Implement createTrustPaymentsSession() below
 *   2. Create a UI component at components/checkout/TrustPaymentsForm.tsx
 *   3. Add the "TRUST_PAYMENTS" case in app/api/checkout/route.ts
 *   4. Set enabled: true in site.config.ts → payments.trustPayments
 */

export const TRUST_PAYMENTS_ENV_VARS = [
  "TRUST_PAYMENTS_SITE_REFERENCE",
  "TRUST_PAYMENTS_USERNAME",
  "TRUST_PAYMENTS_PASSWORD",
] as const;

export interface CreateTrustPaymentsSessionParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
}

/**
 * @throws Not yet implemented
 */
export async function createTrustPaymentsSession(
  _params: CreateTrustPaymentsSessionParams
): Promise<{ sessionId: string }> {
  throw new Error("Trust Payments gateway is not yet implemented.");
}
