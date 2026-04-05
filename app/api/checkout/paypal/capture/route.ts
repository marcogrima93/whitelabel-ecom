import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/payments/gateways/paypal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/checkout/paypal/capture
 *
 * Captures an approved PayPal order and marks the internal order as paid.
 * Called client-side by PayPalForm's onApprove() callback after buyer approves.
 *
 * Body: { paypalOrderId: string; orderNumber: string }
 * Response: { status: string; orderNumber: string }
 */
export async function POST(req: Request) {
  try {
    const { paypalOrderId, orderNumber } = await req.json();

    if (!paypalOrderId || !orderNumber) {
      return NextResponse.json(
        { error: "paypalOrderId and orderNumber are required" },
        { status: 400 }
      );
    }

    const { status, captureId } = await capturePayPalOrder(paypalOrderId);

    if (status !== "COMPLETED") {
      return NextResponse.json(
        { error: `PayPal capture status: ${status}` },
        { status: 402 }
      );
    }

    // Update the order status in the database
    const supabase = await createServerSupabaseClient();
    const { error: dbError } = await supabase
      .from("orders")
      .update({
        status: "CONFIRMED",
        stripe_payment_intent_id: `paypal_capture_${captureId}`, // reuse the column for capture ID
      })
      .eq("order_number", orderNumber);

    if (dbError) {
      console.error("Failed to update order after PayPal capture:", dbError);
      // Don't fail the response — payment was captured, order update can be retried via webhook
    }

    return NextResponse.json({ status, orderNumber });
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error.message || "PayPal capture failed" },
      { status: 500 }
    );
  }
}
