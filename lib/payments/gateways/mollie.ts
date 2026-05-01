/**
 * Mollie Gateway Module
 * ──────────────────────
 * Server-side Mollie integration using the official @mollie/api-client SDK.
 *
 * Required env vars:
 *   MOLLIE_API_KEY  — test_... or live_... key from the Mollie dashboard
 *
 * Flow:
 *   1. createMolliePayment() creates a Mollie payment and returns the checkout URL.
 *   2. Browser is redirected to the Mollie hosted checkout page.
 *   3. On return, the redirect URL includes ?mollie_payment_id=<id> so the
 *      checkout page can confirm the payment status.
 *   4. The Mollie webhook (POST /api/webhooks/mollie) fires asynchronously and
 *      updates the internal order status.
 *
 * Billing address:
 *   Passed to the Mollie API via the `billingAddress` field when the customer
 *   ticks "use same address for billing" at checkout.
 *
 * Docs: https://docs.mollie.com/reference/create-payment
 */

import { createMollieClient } from "@mollie/api-client";
import type { PaymentMethod } from "@mollie/api-client";

export const MOLLIE_ENV_VARS = ["MOLLIE_API_KEY"] as const;

/** Lazy singleton — only initialised when Mollie is actually used */
let _mollie: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient(): ReturnType<typeof createMollieClient> | null {
  if (_mollie) return _mollie;
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return null;
  _mollie = createMollieClient({ apiKey: key });
  return _mollie;
}

export interface MollieBillingAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "MT" */
  country: string;
}

export interface CreateMolliePaymentParams {
  /** Total in major units (e.g. 12.50 for €12.50) */
  total: number;
  /** ISO 4217 currency code, e.g. "EUR" */
  currencyCode: string;
  /** Internal order reference */
  orderNumber: string;
  /** Customer email — shown on the Mollie hosted page */
  customerEmail?: string;
  /** Full URL Mollie redirects the browser to after payment (all statuses except explicit cancel) */
  redirectUrl: string;
  /** Full URL Mollie redirects to when the customer explicitly presses cancel — keeps redirectUrl for success/pending only */
  cancelUrl: string;
  /** Full URL Mollie POSTs payment status updates to */
  webhookUrl: string;
  /**
   * When provided (delivery + "use same address for billing" ticked),
   * the address is forwarded to Mollie so the checkout page is pre-filled.
   */
  billingAddress?: MollieBillingAddress | null;
}

export interface MolliePaymentResult {
  /** Mollie payment ID — used to verify status on return */
  paymentId: string;
  /** Hosted checkout URL to redirect the browser to */
  checkoutUrl: string;
}

/**
 * Creates a Mollie payment and returns the hosted checkout URL.
 * Throws if Mollie is not configured or the API call fails.
 */
export async function createMolliePayment(
  params: CreateMolliePaymentParams
): Promise<MolliePaymentResult> {
  const mollie = getMollieClient();
  if (!mollie) {
    throw new Error("[mollie] MOLLIE_API_KEY is not set.");
  }

  const {
    total,
    currencyCode,
    orderNumber,
    customerEmail,
    redirectUrl,
    cancelUrl,
    webhookUrl,
    billingAddress,
  } = params;

  // Mollie requires amount as a decimal string with exactly 2dp, e.g. "12.50"
  const amountValue = total.toFixed(2);

  // Build the create-payment request payload
  const createPayload: Parameters<typeof mollie.payments.create>[0] = {
    amount: {
      currency: currencyCode.toUpperCase() as string,
      value: amountValue,
    },
    description: `Order ${orderNumber}`,
    redirectUrl,
    // cancelUrl: when the customer presses "back" / cancel on the Mollie page,
    // they are sent here instead of to redirectUrl. This lets us show a proper
    // "payment cancelled" page without falsely showing "payment received".
    cancelUrl,
    // webhookUrl must be an https:// URL in production; Mollie ignores it in test mode
    webhookUrl,
    metadata: {
      orderNumber,
      ...(customerEmail ? { customerEmail } : {}),
    },
  };

  // Attach billing address if provided
  if (billingAddress) {
    (createPayload as any).billingAddress = {
      streetAndNumber: [billingAddress.line1, billingAddress.line2]
        .filter(Boolean)
        .join(", "),
      city: billingAddress.city,
      postalCode: billingAddress.postcode,
      country: billingAddress.country.toUpperCase(),
      ...(billingAddress.county ? { region: billingAddress.county } : {}),
    };
  }

  const payment = await mollie.payments.create(createPayload);

  const checkoutUrl = payment.getCheckoutUrl();
  if (!checkoutUrl) {
    throw new Error(
      `[mollie] Payment created but no checkout URL returned for payment ${payment.id}`
    );
  }

  return {
    paymentId: payment.id,
    checkoutUrl,
  };
}

/**
 * Retrieves a Mollie payment by ID and returns its status.
 * Used by the webhook and the return-URL handler to confirm payment.
 */
export async function getMolliePayment(paymentId: string) {
  const mollie = getMollieClient();
  if (!mollie) {
    throw new Error("[mollie] MOLLIE_API_KEY is not set.");
  }
  return mollie.payments.get(paymentId);
}
