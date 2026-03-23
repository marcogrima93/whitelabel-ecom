import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/modules/ecom/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/modules/ecom/lib/utils";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Create order in database
      const { error } = await supabase.from("orders").insert({
        order_number: generateOrderNumber(),
        email: session.customer_email || session.customer_details?.email || "unknown@email.com",
        status: "confirmed",
        payment_status: "paid",
        subtotal: (session.amount_subtotal || 0) / 100,
        tax: (session.total_details?.amount_tax || 0) / 100,
        shipping_cost: (session.total_details?.amount_shipping || 0) / 100,
        total: (session.amount_total || 0) / 100,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        shipping_address: session.shipping_details as any,
        metadata: { stripe_session: session.id },
      });

      if (error) {
        console.error("Error creating order:", error);
      }

      // TODO: Send confirmation email via Resend
      // TODO: Update inventory counts
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error("Payment failed:", paymentIntent.id, paymentIntent.last_payment_error?.message);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
