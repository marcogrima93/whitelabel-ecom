import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/modules/ecom/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "../../../../site.config";

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Get user email if logged in
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const lineItems = items.map((item: { name: string; price: number; quantity: number; image?: string }) => ({
      price_data: {
        currency: siteConfig.currency.toLowerCase(),
        product_data: {
          name: item.name,
          ...(item.image && item.image.startsWith("http") ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    }));

    const session = await createCheckoutSession({
      lineItems,
      customerEmail: user?.email || undefined,
      orderId: `pending-${Date.now()}`,
      successUrl: `${siteConfig.url}/checkout/success`,
      cancelUrl: `${siteConfig.url}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
