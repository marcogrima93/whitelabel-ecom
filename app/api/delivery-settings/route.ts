import { NextResponse } from "next/server";
import { getFulfillmentSettings } from "@/lib/supabase/settings";

/**
 * GET /api/delivery-settings
 *
 * Returns the full fulfillment settings object:
 * {
 *   slots: {
 *     delivery:   { 0: { morning: bool, afternoon: bool, evening: bool }, … 6 },
 *     collection: { 0: { … }, … 6 },
 *   },
 *   blocked_days:  { delivery: number[], collection: number[] },
 *   blocked_dates: { delivery: string[], collection: string[] },
 * }
 */
export async function GET() {
  try {
    const settings = await getFulfillmentSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/delivery-settings error:", error);
    // Return a safe empty-state so the checkout page never crashes
    return NextResponse.json({
      slots: { delivery: {}, collection: {} },
      blocked_days: { delivery: [], collection: [] },
      blocked_dates: { delivery: [], collection: [] },
    });
  }
}
