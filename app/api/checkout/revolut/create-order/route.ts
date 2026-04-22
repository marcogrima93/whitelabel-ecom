/**
 * POST /api/checkout/revolut/create-order
 * ─────────────────────────────────────────
 * Secure server-side bridge: receives the order details from the client-side
 * RevolutForm, calls createRevolutOrder(), and returns the public `token`
 * needed by the Revolut Pay SDK.
 *
 * The secret REVOLUT_API_KEY never leaves the server.
 */

import { NextResponse } from "next/server";
import { createRevolutOrder } from "@/lib/payments/gateways/revolut";

export async function POST(req: Request) {
  try {
    const { orderNumber, total, currencyCode, customerEmail, customerName } =
      await req.json();

    if (!orderNumber || typeof total !== "number" || !currencyCode) {
      return NextResponse.json(
        { error: "Missing required fields: orderNumber, total, currencyCode" },
        { status: 400 }
      );
    }

    const result = await createRevolutOrder({
      total,
      currencyCode,
      orderNumber,
      customerEmail,
      customerName,
    });

    // Return only the public token — never expose the secret key or full order
    return NextResponse.json({ token: result.token, orderId: result.orderId });
  } catch (err: any) {
    console.error("[revolut] create-order error:", err?.message ?? err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create Revolut order" },
      { status: 500 }
    );
  }
}
