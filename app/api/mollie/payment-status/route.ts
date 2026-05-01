/**
 * GET /api/mollie/payment-status?id=tr_xxx
 * ──────────────────────────────────────────
 * Server-side payment status lookup.
 * Called by the /order-confirmation page after Mollie redirects back.
 *
 * Mollie appends ?id=tr_xxx to the redirectUrl. We use that ID to fetch
 * the real payment object from the Mollie API and return its status.
 * This is the only correct way to determine payment outcome on the
 * redirect — the URL params themselves cannot be trusted.
 *
 * Docs: https://docs.mollie.com/docs/redirect-url
 */

import { NextResponse } from "next/server";
import { getMolliePayment } from "@/lib/payments/gateways/mollie";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("id");

  if (!paymentId || !paymentId.startsWith("tr_")) {
    return NextResponse.json(
      { error: "Missing or invalid payment id" },
      { status: 400 }
    );
  }

  try {
    const payment = await getMolliePayment(paymentId);
    return NextResponse.json({ status: payment.status });
  } catch (err: any) {
    console.error("[mollie] payment-status lookup error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
