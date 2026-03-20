import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getOrderByPaymentIntent, updateOrderStatus } from "@/lib/supabase/queries";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;
  
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook not configured: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const signatureList = await headers();
  const signature = signatureList.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment successful for intent: ${paymentIntent.id}`);
      
      // Find the order by payment intent ID and update status to CONFIRMED
      const order = await getOrderByPaymentIntent(paymentIntent.id);
      
      if (order) {
        await updateOrderStatus(order.id, "CONFIRMED");
        console.log(`Order ${order.order_number} confirmed`);
        
        // TODO: Trigger order confirmation email via Resend
        // await sendOrderConfirmationEmail(order);
      } else {
        console.error(`No order found for payment intent: ${paymentIntent.id}`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      console.error(`Payment failed for intent: ${failedIntent.id}`);
      
      // Find the order and update status to CANCELLED
      const order = await getOrderByPaymentIntent(failedIntent.id);
      
      if (order) {
        await updateOrderStatus(order.id, "CANCELLED");
        console.log(`Order ${order.order_number} cancelled due to payment failure`);
      }
      break;
    }

    case "payment_intent.canceled": {
      const canceledIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment cancelled for intent: ${canceledIntent.id}`);
      
      const order = await getOrderByPaymentIntent(canceledIntent.id);
      
      if (order) {
        await updateOrderStatus(order.id, "CANCELLED");
        console.log(`Order ${order.order_number} cancelled`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
