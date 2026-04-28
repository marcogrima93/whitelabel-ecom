/**
 * POST /api/checkout/revolut/confirm
 * ────────────────────────────────────
 * Called by RevolutForm.onSuccess to store the Revolut orderId on our internal
 * order record so the admin panel can label it as "Revolut Pay" instead of "Cash".
 *
 * The Revolut orderId (e.g. "8b9f5e34-...") is stored in the reused
 * stripe_payment_intent_id column, prefixed with "revolut_" so
 * getPaymentGatewayLabel() can identify it.
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { orderNumber, revolutOrderId }: { orderNumber: string; revolutOrderId: string } =
      await req.json();

    if (!orderNumber || !revolutOrderId) {
      return NextResponse.json(
        { error: "Missing orderNumber or revolutOrderId" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    const { error } = await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: `revolut_${revolutOrderId}` })
      .eq("order_number", orderNumber);

    if (error) {
      console.error("[revolut confirm] Failed to update order:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[revolut confirm] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
