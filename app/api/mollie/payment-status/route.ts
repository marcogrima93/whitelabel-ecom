/**
 * GET /api/mollie/payment-status?orderNumber=ORD-xxx
 * ────────────────────────────────────────────────────
 * Looks up the real Mollie payment status for a given order.
 *
 * Flow:
 *   1. Fetch the order from the DB by orderNumber
 *   2. If the order has a tr_xxx in stripe_payment_intent_id, fetch that
 *      payment from the Mollie API and return its status.
 *   3. If there is no tr_xxx yet (webhook hasn't fired yet, e.g. < 1 second
 *      after redirect), poll briefly — return "open" so the UI shows pending.
 *   4. If the order has a non-Mollie payment ID or no payment ID at all,
 *      return "success" so non-Mollie gateways always show "Payment received".
 */

import { NextResponse } from "next/server";
import { getMolliePayment } from "@/lib/payments/gateways/mollie";
import { getOrderByOrderNumber } from "@/lib/supabase/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) {
    return NextResponse.json(
      { error: "Missing orderNumber" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrderByOrderNumber(orderNumber);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentId = order.stripe_payment_intent_id;

    // No payment ID stored yet — webhook hasn't fired. Could be a brand new
    // payment (< 2s after redirect) or a non-Mollie order.
    // Return "open" so the confirmation page shows "Payment pending" while
    // the customer waits. The page will retry after a short delay.
    if (!paymentId) {
      return NextResponse.json({ status: "open", retryable: true });
    }

    // Non-Mollie payment (Stripe pi_xxx, PayPal paypal_capture_xxx, etc.)
    // These never land on this page via Mollie redirect — return success.
    if (!paymentId.startsWith("tr_")) {
      return NextResponse.json({ status: "success" });
    }

    // Fetch the real status from Mollie
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
