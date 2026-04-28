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

    // Redirect back to the dedicated /order-confirmation page after payment.
    // This avoids the empty-cart problem that would occur if we redirected back
    // to /checkout (Mollie loads a fresh page so cart state is gone).
    // We pass orderNumber so the page can display the reference.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

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
