/**
 * PayPal Gateway Module
 * ──────────────────────
 * Full server-side implementation using PayPal REST API v2 (no SDK required).
 * Required env vars:
 *   - PAYPAL_CLIENT_ID
 *   - NEXT_PUBLIC_PAYPAL_CLIENT_ID  (used by PayPalScriptProvider on the client)
 *   - PAYPAL_CLIENT_SECRET
 *   - PAYPAL_MODE  ("sandbox" | "live", defaults to "sandbox")
 *
 * UI: components/checkout/PayPalForm.tsx
 */

export const PAYPAL_ENV_VARS = [
  "PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
] as const;

function getPayPalBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE ?? "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/**
 * Fetches an OAuth2 access token from PayPal using client credentials.
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const base = getPayPalBaseUrl();

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal OAuth2 failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface CreatePayPalOrderParams {
  total: number;
  currencyCode: string;
  orderNumber: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResult {
  paypalOrderId: string;
}

/**
 * Creates a PayPal order via REST API v2.
 * Called server-side from app/api/checkout/route.ts.
 */
export async function createPayPalOrder(
  params: CreatePayPalOrderParams
): Promise<PayPalOrderResult> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseUrl();

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": params.orderNumber, // Idempotency key
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderNumber,
          amount: {
            currency_code: params.currencyCode.toUpperCase(),
            value: params.total.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "Shop",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal create order failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return { paypalOrderId: data.id as string };
}

/**
 * Captures a PayPal order after the buyer has approved it.
 * Called server-side from app/api/checkout/paypal/capture/route.ts.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  status: string;
  captureId: string;
}> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseUrl();

  const res = await fetch(
    `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `PayPal capture failed (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();
  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? "";

  return { status: data.status as string, captureId };
}
