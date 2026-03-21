import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { createOrder } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" }) : null;

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(req: Request) {
  try {
    const {
      items,
      customerEmail,
      deliveryMethod,
      deliveryAddress,
      deliverySlot,
      notes,
      paymentMethod,
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const subtotal = items.reduce((acc: number, item: any) => acc + item.pricePerUnit * item.quantity, 0);
    const vatAmount = subtotal * siteConfig.vatRate;

    let deliveryFee = 0;
    if (deliveryMethod === "DELIVERY") {
      const town = deliveryAddress?.town || deliveryAddress?.city || deliveryAddress?.region;
      const townConfig = siteConfig.delivery.towns.find((t: any) => t.name === town);
      deliveryFee =
        subtotal >= siteConfig.delivery.freeThreshold
          ? 0
          : townConfig?.fee || siteConfig.delivery.towns[0]?.fee || 0;
    }

    const total = subtotal + vatAmount + deliveryFee;
    const orderNumber = generateOrderNumber();

    const orderItems = items.map((item: any) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image || "",
      selectedOption: item.selectedOption || "",
      pricePerUnit: item.pricePerUnit,
      quantity: item.quantity,
    }));

    const orderBase = {
      orderNumber,
      userId: user?.id,
      email: customerEmail,
      deliveryMethod: deliveryMethod || "DELIVERY",
      deliveryAddress: deliveryAddress || null,
      deliveryFee,
      deliverySlot: deliverySlot || null,
      subtotal,
      vatAmount,
      total,
      notes: notes || null,
      items: orderItems,
    };

    // ── Cash on Delivery ─────────────────────────────────────────────────
    if (paymentMethod === "CASH") {
      const order = await createOrder({ ...orderBase, stripePaymentIntentId: undefined });
      return NextResponse.json({ orderNumber: order?.order_number || orderNumber });
    }

    // ── Stripe not configured — mock mode ─────────────────────────────────
    if (!stripe) {
      console.warn("Stripe is not configured. Creating order without payment.");
      const order = await createOrder({
        ...orderBase,
        stripePaymentIntentId: "mock_" + Date.now(),
      });
      return NextResponse.json({
        clientSecret: "pi_mock_secret_develop_only",
        orderNumber: order?.order_number || orderNumber,
        mock: true,
      });
    }

    // ── Stripe payment ────────────────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: siteConfig.currency.code.toLowerCase(),
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderNumber,
        customerEmail,
        userId: user?.id || "",
        itemCount: items.length.toString(),
      },
    });

    const order = await createOrder({
      ...orderBase,
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!order) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
