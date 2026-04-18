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

export const REVOLUT_ENV_VARS = [
  "REVOLUT_API_KEY",
  "NEXT_PUBLIC_REVOLUT_PUBLIC_ID",
] as const;

export interface CreateRevolutOrderParams {
  /** Total in the lowest denomination (e.g. cents). Must be an integer. */
  total: number;
  /** ISO 4217 currency code, e.g. "EUR" */
  currencyCode: string;
  /** Internal order reference stored in the Revolut order's description */
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
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
    ? "https://merchant.revolut.com/api/1.0"
    : "https://sandbox-merchant.revolut.com/api/1.0";
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

  const { total, currencyCode, orderNumber, customerEmail, customerName } = params;

  const body: Record<string, unknown> = {
    amount: Math.round(total), // must be integer (lowest denomination)
    currency: currencyCode.toUpperCase(),
    description: `Order ${orderNumber}`,
    capture_mode: "automatic",
  };

  // Optionally attach customer details for a smoother checkout experience
  if (customerEmail || customerName) {
    body.customer = {
      ...(customerEmail ? { email: customerEmail } : {}),
      ...(customerName ? { full_name: customerName } : {}),
    };
  }

  const res = await fetch(`${getBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[revolut] Failed to create order (${res.status}): ${text}`
    );
  }

  const data = await res.json();

  return {
    orderId: data.id as string,
    token: data.token as string,
  };
}
