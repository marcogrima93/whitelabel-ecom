/**
 * Revolut Gateway Module
 * ──────────────────────
 * Server-side helper to create a Revolut Merchant API order.
 *
 * Required env vars:
 *   REVOLUT_API_KEY             — secret key (sk_...)
 *   REVOLUT_API_MODE            — "sandbox" | "production" (defaults to "sandbox")
 *   NEXT_PUBLIC_REVOLUT_PUBLIC_ID — public API key shown client-side
 *
 * Docs: https://developer.revolut.com/docs/merchant/create-order
 */

import { toMinorUnits } from "@/lib/pricing";

export const REVOLUT_ENV_VARS = [
  "REVOLUT_API_KEY",
  "NEXT_PUBLIC_REVOLUT_PUBLIC_ID",
] as const;

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface CreateRevolutOrderParams {
  /** Total in the lowest denomination (e.g. cents). Must be an integer. */
  total: number;
  /** ISO 4217 currency code, e.g. "EUR" */
  currencyCode: string;
  /** Internal order reference stored in the Revolut order's description */
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
  /**
   * When provided the address is attached to the Revolut customer object so
   * the gateway can pre-fill / skip the billing address step.
   */
  billingAddress?: BillingAddress | null;
}

export interface RevolutOrderResult {
  /** Revolut order UUID */
  orderId: string;
  /** Public token returned by Revolut — passed to the client SDK as `publicId` */
  token: string;
}

function getBaseUrl(): string {
  const mode = process.env.REVOLUT_API_MODE ?? "sandbox";
  return mode === "production"
    ? "https://merchant.revolut.com/api"      // ← remove /1.0
    : "https://sandbox-merchant.revolut.com/api"; // ← remove /1.0
}

/**
 * Calls the Revolut Merchant API to create a payment order.
 * Returns the order ID and the public token needed by the client SDK.
 */
export async function createRevolutOrder(
  params: CreateRevolutOrderParams
): Promise<RevolutOrderResult> {
  const apiKey = process.env.REVOLUT_API_KEY;
  if (!apiKey) {
    throw new Error("[revolut] REVOLUT_API_KEY is not set.");
  }

  const { total, currencyCode, orderNumber, customerEmail, customerName, billingAddress } = params;

  const body: Record<string, unknown> = {
    amount: toMinorUnits(total), // must be integer (lowest denomination)
    currency: currencyCode.toUpperCase(),
    description: `Order ${orderNumber}`,
    capture_mode: "automatic",
  };

  // Optionally attach customer details (no address field on customer object per API spec).
  if (customerEmail || customerName) {
    body.customer = {
      ...(customerEmail ? { email: customerEmail } : {}),
      ...(customerName ? { full_name: customerName } : {}),
    };
  }

  // Note: billing address pre-fill is handled client-side by the Revolut
  // Checkout widget (billingAddress option) — it is NOT an order API field.

  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Revolut-Api-Version": "2024-09-01",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `[revolut] Failed to create order (${res.status}): ${JSON.stringify(data)}`
    );
  }

  if (!data?.token) {
    throw new Error(
      `[revolut] Revolut order created but no token returned: ${JSON.stringify(data)}`
    );
  }

  return {
    orderId: data.id as string,
    token: data.token as string,
  };
}
