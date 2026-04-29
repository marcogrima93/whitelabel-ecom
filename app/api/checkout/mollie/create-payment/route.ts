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

    // Determine the origin to use for redirect and webhook URLs.
    // In production we always use siteConfig.shopUrl so URLs are canonical.
    // In development we use the request's own origin header (e.g. http://localhost:3000)
    // so Mollie redirects back to the correct local port after test payment.
    const requestOrigin = req.headers.get("origin") ?? "";
    const isLocalDev =
      requestOrigin.startsWith("http://localhost") ||
      requestOrigin.startsWith("http://127.0.0.1");

    const origin = isLocalDev
      ? requestOrigin
      : siteConfig.shopUrl || requestOrigin || "http://localhost:3000";

    const redirectUrl = `${origin}/order-confirmation?orderNumber=${encodeURIComponent(orderNumber)}`;

    // In test mode Mollie silently ignores the webhookUrl if it is not a publicly
    // accessible https URL. For local development this is expected.
    const webhookUrl = `${origin}/api/webhooks/mollie`;

    const result = await createMolliePayment({
      total,
      currencyCode,
      orderNumber,
      customerEmail,
      redirectUrl,
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
