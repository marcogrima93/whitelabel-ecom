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

    // Always store the payment ID first so admin panel labels correctly regardless of status.
    // This is a no-op if already set, but ensures even PAYMENT_PENDING orders are labelled "Mollie".
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentId })
      .eq("id", order.id);

    switch (payment.status) {
      /**
       * OPEN    — payment created/initiated but not yet settled (e.g. bank transfer, some redirect methods).
       * PENDING — payment in progress, outcome not yet known.
       * Webhook fires for these. Move to PAYMENT_PENDING so admin can see it's awaiting money.
       * Will transition to PENDING (paid) or CANCELLED when a follow-up webhook fires.
       */
      case "open":
      case "pending": {
        if (order.status !== "PAYMENT_PENDING") {
          await updateOrderStatus(order.id, "PAYMENT_PENDING");
        }
        console.log(`[mollie webhook] Order ${orderNumber} set to PAYMENT_PENDING (mollie: ${payment.status})`);
        break;
      }

      /**
       * AUTHORIZED — card/Klarna authorised, awaiting capture (money guaranteed).
       * PAID       — payment fully settled.
       * Both → PENDING (ready for admin to fulfil).
       */
      case "authorized":
      case "paid": {
        if (order.status !== "PENDING") {
          await updateOrderStatus(order.id, "PENDING");
        }
        console.log(`[mollie webhook] Order ${orderNumber} set to PENDING — payment ${payment.status} (${paymentId})`);
        break;
      }

      /**
       * CANCELED — customer cancelled. Definitive.
       * EXPIRED  — timed out. Definitive.
       * FAILED   — no retry possible. Definitive.
       * Guard against double-writes — only cancel if not already in a terminal state.
       */
      case "canceled":
      case "expired":
      case "failed": {
        const nonTerminal: string[] = ["PENDING", "PAYMENT_PENDING"];
        if (nonTerminal.includes(order.status)) {
          await updateOrderStatus(order.id, "CANCELLED");
        }
        console.log(`[mollie webhook] Order ${orderNumber} CANCELLED (mollie: ${payment.status})`);
        break;
      }

      default:
        console.log(`[mollie webhook] Payment ${paymentId} unhandled status '${payment.status}'`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[mollie webhook] Error:", err?.message ?? err);
    // Return 200 — if we return 4xx/5xx Mollie will keep retrying
    return NextResponse.json({ received: true });
  }
}
