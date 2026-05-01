/**
 * POST /api/checkout/mollie/create-payment
 * ─────────────────────────────────────────
 * Secure server-side bridge: receives order details from the client-side
 * MollieForm, calls createMolliePayment(), and returns the hosted checkout URL
 * to redirect the browser to.
 *
 * The secret MOLLIE_API_KEY never leaves the server.
 */

import { NextResponse } from "next/server";
import { createMolliePayment } from "@/lib/payments/gateways/mollie";
import type { MollieBillingAddress } from "@/lib/payments/gateways/mollie";
import { siteConfig } from "@/site.config";

export async function POST(req: Request) {
  try {
    const {
      orderNumber,
      total,
      currencyCode,
      customerEmail,
      billingAddress,
    }: {
      orderNumber: string;
      total: number;
      currencyCode: string;
      customerEmail?: string;
      billingAddress?: MollieBillingAddress | null;
    } = await req.json();

    if (!orderNumber || typeof total !== "number" || !currencyCode) {
      return NextResponse.json(
        { error: "Missing required fields: orderNumber, total, currencyCode" },
        { status: 400 }
      );
    }

    // Determine the canonical origin.
    // In local dev use the request origin so Mollie redirects back to localhost.
    const requestOrigin = req.headers.get("origin") ?? "";
    const isLocalDev =
      requestOrigin.startsWith("http://localhost") ||
      requestOrigin.startsWith("http://127.0.0.1");
    const origin = isLocalDev
      ? requestOrigin
      : siteConfig.shopUrl || requestOrigin || "http://localhost:3000";

    // redirectUrl — reached for ALL terminal statuses EXCEPT explicit cancel
    // (when cancelUrl is set). We pass orderNumber so the page can look it up.
    const redirectUrl = `${origin}/order-confirmation?orderNumber=${encodeURIComponent(orderNumber)}`;

    // cancelUrl — reached ONLY when the customer explicitly presses "back" or
    // "cancel" on the Mollie hosted checkout page. We send them back to the
    // checkout page with a query param so we can show a cancellation notice.
    const cancelUrl = `${origin}/checkout?cancelled=1`;

    // In test mode Mollie silently ignores the webhookUrl if it is not a publicly
    // accessible https URL. For local development this is expected.
    const webhookUrl = `${origin}/api/webhooks/mollie`;

    const result = await createMolliePayment({
      total,
      currencyCode,
      orderNumber,
      customerEmail,
      redirectUrl,
      cancelUrl,
      webhookUrl,
      billingAddress: billingAddress ?? null,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      paymentId: result.paymentId,
    });
  } catch (err: any) {
    console.error("[mollie] create-payment error:", err?.message ?? err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create Mollie payment" },
      { status: 500 }
    );
  }
}
