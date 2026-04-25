import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { createPayPalOrder } from "@/lib/payments/gateways/paypal";

/**
 * POST /api/checkout/paypal/create
 *
 * Creates a PayPal order for an already-initialised internal order.
 * Called client-side by PayPalForm's createOrder() callback.
 *
 * Body: { orderNumber: string }
 * Response: { paypalOrderId: string }
 */
export async function POST(req: Request) {
  try {
    const { orderNumber, total } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const result = await createPayPalOrder({
      total,
      currencyCode: siteConfig.currency.code,
      orderNumber,
      returnUrl: `${origin}/checkout?paypal=success`,
      cancelUrl: `${origin}/checkout?paypal=cancel`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PayPal create order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
