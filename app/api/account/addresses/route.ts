import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getUserAddresses, createAddress } from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);
    const addresses = await getUserAddresses(user.id);
    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, line_1, line_2, city, region, postcode, is_default } = body;

    if (!label || !line_1 || !city || !postcode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If marking as default, unset existing defaults first
    if (is_default) {
      const admin = await createServiceRoleClient();
      await admin.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    const address = await createAddress({
      user_id: user.id,
      label,
      // full_name is intentionally omitted — it is stored on profiles.name, not on addresses.
      // phone is intentionally omitted — it is stored on profiles.phone, not on addresses.
      line_1,
      line_2: line_2 || null,
      city,
      region: region || city,
      postcode,
      is_default: is_default ?? false,
    });

    if (!address) return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
    return NextResponse.json(address);
  } catch (err) {
    console.error("POST /api/account/addresses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
