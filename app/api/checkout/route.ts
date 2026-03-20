import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import Stripe from "stripe";

// Initialize Stripe if key exists, otherwise let it fail gracefully or mock
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2023-10-16" }) : null;

export async function POST(req: Request) {
  try {
    const { items, customerEmail, deliveryRequired } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!stripe) {
      // Return a simulated client secret for development if Stripe isn't configured
      console.warn("Stripe is not configured. Returning mock intent for development.");
      return NextResponse.json({
        clientSecret: "pi_mock_secret_develop_only",
        mock: true
      });
    }

    // Calculate total on server to prevent manipulation
    // In production, fetch current prices from DB here!
    const amount = items.reduce((acc: number, item: any) => {
      // Note: Must match exactly with DB. For demo just trusting client payload
      return acc + (item.pricePerUnit * item.quantity);
    }, 0);

    const vatAmount = amount * siteConfig.vatRate;
    
    // Delivery fee logic
    let deliveryFee = 0;
    if (deliveryRequired) {
        // In real app, calculate based on selected region
        deliveryFee = amount >= siteConfig.delivery.freeThreshold ? 0 : siteConfig.delivery.regions[0].fee;
    }

    const totalAmount = amount + vatAmount + deliveryFee;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects cents
      currency: siteConfig.currency.code.toLowerCase(),
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        itemCount: items.length.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
