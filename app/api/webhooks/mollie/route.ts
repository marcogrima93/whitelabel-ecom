/**
 * POST /api/webhooks/mollie
 * ─────────────────────────
 * Receives asynchronous payment status updates from Mollie.
 *
 * Mollie POSTs a form-encoded body with a single field: id (the payment ID).
 * We fetch the full payment object from the API to verify its status, then
 * update the internal order accordingly.
 *
 * Docs: https://docs.mollie.com/docs/webhooks
 *
 * NOTE: Mollie does not sign webhook requests. The only verification is
 * fetching the payment from the Mollie API using the supplied ID — if the ID
 * is fake/tampered, the API will return a 404 and we abort safely.
 */

import { NextResponse } from "next/server";
import { getMolliePayment } from "@/lib/payments/gateways/mollie";
import {
  getOrderByOrderNumber,
  updateOrderStatus,
} from "@/lib/supabase/queries";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // Mollie sends application/x-www-form-urlencoded: id=tr_xxxx
    const text = await req.text();
    const params = new URLSearchParams(text);
    const paymentId = params.get("id");

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    // Fetch the real payment from Mollie — this is the integrity check
    const payment = await getMolliePayment(paymentId);

    const orderNumber = (payment.metadata as any)?.orderNumber as string | undefined;
    if (!orderNumber) {
      console.error(`[mollie webhook] No orderNumber in metadata for payment ${paymentId}`);
      // Return 200 so Mollie stops retrying — we cannot do anything without an orderNumber
      return NextResponse.json({ received: true });
    }

    const order = await getOrderByOrderNumber(orderNumber);
    if (!order) {
      console.error(`[mollie webhook] No order found for orderNumber ${orderNumber}`);
      return NextResponse.json({ received: true });
    }

    switch (payment.status) {
      case "paid": {
        // Payment confirmed — order stays PENDING until admin fulfils it.
        // Confirmation email is sent at order creation; no need to re-send.
        console.log(`[mollie webhook] Payment confirmed for order ${orderNumber}`);
        break;
      }
      case "failed":
      case "canceled":
      case "expired": {
        await updateOrderStatus(order.id, "CANCELLED");
        console.log(`[mollie webhook] Order ${orderNumber} cancelled (status: ${payment.status})`);
        break;
      }
      default:
        // open, pending, authorized — no action needed
        console.log(`[mollie webhook] Payment ${paymentId} status: ${payment.status}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[mollie webhook] Error:", err?.message ?? err);
    // Return 200 — if we return 4xx/5xx Mollie will keep retrying
    return NextResponse.json({ received: true });
  }
}
