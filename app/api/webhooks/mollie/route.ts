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
import { createServiceRoleClient } from "@/lib/supabase/server";

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

    const supabase = await createServiceRoleClient();

    switch (payment.status) {
      /**
       * AUTHORIZED — card or Klarna payment has been authorised and awaits capture.
       * Store the payment ID so the admin panel can label it as "Mollie", but keep
       * the order as PENDING (no money received yet, capture pending).
       */
      case "authorized": {
        await supabase
          .from("orders")
          .update({ stripe_payment_intent_id: paymentId })
          .eq("id", order.id);
        console.log(`[mollie webhook] Payment ${paymentId} authorised for order ${orderNumber} — awaiting capture`);
        break;
      }

      /**
       * PAID — payment fully settled. Store the payment ID (labels as "Mollie" in
       * admin panel) and keep the order PENDING for the admin to fulfil. This is
       * the same pattern as Stripe/Revolut/PayPal — no automatic status promotion.
       */
      case "paid": {
        await supabase
          .from("orders")
          .update({ stripe_payment_intent_id: paymentId })
          .eq("id", order.id);
        console.log(`[mollie webhook] Payment confirmed for order ${orderNumber} (${paymentId})`);
        break;
      }

      /**
       * CANCELED — customer explicitly cancelled on the Mollie hosted page.
       * EXPIRED  — customer abandoned / payment timed out.
       * FAILED   — payment attempt failed with no retry possible.
       * All three are definitive terminal statuses — cancel the order.
       */
      case "canceled":
      case "expired":
      case "failed": {
        // Only cancel if the order hasn't already been moved to a terminal state
        if (order.order_status === "PENDING") {
          await updateOrderStatus(order.id, "CANCELLED");
        }
        console.log(`[mollie webhook] Order ${orderNumber} cancelled (mollie status: ${payment.status})`);
        break;
      }

      /**
       * OPEN    — payment created but not yet started; no webhook fired by Mollie.
       * PENDING — payment in progress; no webhook fired by Mollie.
       * Both are handled here defensively in case Mollie behaviour changes.
       */
      case "open":
      case "pending":
      default:
        console.log(`[mollie webhook] Payment ${paymentId} status '${payment.status}' — no action taken`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[mollie webhook] Error:", err?.message ?? err);
    // Return 200 — if we return 4xx/5xx Mollie will keep retrying
    return NextResponse.json({ received: true });
  }
}
