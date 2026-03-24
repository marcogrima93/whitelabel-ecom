import { NextResponse } from "next/server";
import { getDeliverySettings } from "@/lib/supabase/settings";

export async function GET() {
  try {
    const settings = await getDeliverySettings();
    return NextResponse.json(settings || { blocked_days: [], blocked_dates: [] });
  } catch (error) {
    console.error("GET /api/delivery-settings error:", error);
    return NextResponse.json({ blocked_days: [], blocked_dates: [] });
  }
}
