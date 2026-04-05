import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { calcVatAmount, calcTotal } from "@/lib/pricing";
import { createOrder } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { validateEnabledGatewayEnvVars } from "@/lib/payments/registry";
import {
  getStripeClient,
  createStripePaymentIntent,
  cancelStripePaymentIntent,
} from "@/lib/payments/gateways/stripe";
// To handle a new gateway: import its server-side function from lib/payments/gateways/<name>.ts
// and add a case in the payment method switch below.

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(req: Request) {
  try {
    // Validate env vars for all enabled gateways on every request (server-side only).
    // Warnings are logged for any missing vars — disabled gateways are never checked.
    validateEnabledGatewayEnvVars();

    const {
      items,
      customerEmail,
      customerName,
      deliveryMethod,
      deliveryAddress,
      deliverySlot,
      notes,
      paymentMethod,
      discountCode,
      discountAmount: clientDiscountAmount,
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Tag guest orders so staff can identify them in the admin panel
    const isGuest = !user;
    const storedEmail = isGuest ? `${customerEmail} (guest)` : customerEmail;

    const subtotal = items.reduce((acc: number, item: any) => acc + item.pricePerUnit * item.quantity, 0);
    const discountAmountValue = typeof clientDiscountAmount === "number" ? clientDiscountAmount : 0;

    let deliveryFee = 0;
    if (deliveryMethod === "DELIVERY") {
      const town = deliveryAddress?.town || deliveryAddress?.city || deliveryAddress?.region;
      const townConfig = siteConfig.delivery.towns.find((t: any) => t.name === town);
      deliveryFee =
        subtotal >= siteConfig.delivery.freeThreshold
          ? 0
          : townConfig?.fee || siteConfig.delivery.towns[0]?.fee || 0;
    }

    // VAT is computed on (discounted subtotal + delivery) so the delivery charge
    // is always reflected in the stored vat_amount, regardless of vatIncluded mode.
    const discountedSubtotal = subtotal - discountAmountValue;
    const vatAmount = calcVatAmount(discountedSubtotal, deliveryFee);
    const total = calcTotal(discountedSubtotal, deliveryFee);
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
      email: storedEmail,
      deliveryMethod: deliveryMethod || "DELIVERY",
      deliveryAddress: deliveryAddress || null,
      deliveryFee,
      deliverySlot: deliverySlot || null,
      subtotal,
      vatAmount,
      total,
      notes: notes || null,
      items: orderItems,
      discountCode: discountCode || undefined,
      discountAmount: discountAmountValue || undefined,
    };

    // ── Cash on Delivery ─────────────────────────────────────────────────
    if (paymentMethod === "CASH") {
      const order = await createOrder({ ...orderBase, stripePaymentIntentId: undefined });
      if (order) {
        try {
          await sendOrderConfirmationEmail(order, orderItems.map((item: any, i: number) => ({
            id: `tmp-${i}`,
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            product_image: item.productImage,
            selected_option: item.selectedOption,
            price_per_unit: item.pricePerUnit,
            quantity: item.quantity,
            line_total: item.pricePerUnit * item.quantity,
          })));
        } catch (emailErr) {
          console.error("Failed to send confirmation email (cash order):", emailErr);
        }
      }
      return NextResponse.json({ orderNumber: order?.order_number || orderNumber });
    }

    // ── Stripe not configured — mock mode ─────────────────────────────────
    if (paymentMethod === "STRIPE" && !getStripeClient()) {
      console.warn("Stripe is not configured. Creating order without payment.");
      const order = await createOrder({
        ...orderBase,
        stripePaymentIntentId: "mock_" + Date.now(),
      });
      if (order) {
        try {
          await sendOrderConfirmationEmail(order, orderItems.map((item: any, i: number) => ({
            id: `tmp-${i}`,
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            product_image: item.productImage,
            selected_option: item.selectedOption,
            price_per_unit: item.pricePerUnit,
            quantity: item.quantity,
            line_total: item.pricePerUnit * item.quantity,
          })));
        } catch (emailErr) {
          console.error("Failed to send confirmation email (mock order):", emailErr);
        }
      }
      return NextResponse.json({
        clientSecret: "pi_mock_secret_develop_only",
        orderNumber: order?.order_number || orderNumber,
        mock: true,
      });
    }

    // ── PayPal ─────────────────────────────────────────────────────────────
    // Creates the internal order record (status PENDING) and returns the
    // orderNumber. The PayPal order itself is created lazily by the client
    // via POST /api/checkout/paypal/create after the buyer clicks Pay.
    if (paymentMethod === "PAYPAL") {
      const order = await createOrder({ ...orderBase, stripePaymentIntentId: undefined });
      if (!order) {
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }
      return NextResponse.json({ orderNumber: order.order_number });
    }

    // ── Stripe payment ────────────────────────────────────────────────────
    const { clientSecret, paymentIntentId } = await createStripePaymentIntent({
      total,
      customerEmail,
      orderNumber,
      isGuest,
      userId: user?.id,
      itemCount: items.length,
    });

    const order = await createOrder({
      ...orderBase,
      stripePaymentIntentId: paymentIntentId,
    });

    if (!order) {
      await cancelStripePaymentIntent(paymentIntentId);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Send confirmation email immediately on order creation (status = PENDING)
    try {
      await sendOrderConfirmationEmail(order, orderItems.map((item: any, i: number) => ({
        id: `tmp-${i}`,
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        selected_option: item.selectedOption,
        price_per_unit: item.pricePerUnit,
        quantity: item.quantity,
        line_total: item.pricePerUnit * item.quantity,
      })));
    } catch (emailErr) {
      console.error("Failed to send confirmation email (stripe order):", emailErr);
    }

    return NextResponse.json({
      clientSecret,
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
