import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

export interface DeliverySettings {
  id: number;
  blocked_days: number[]; // 0 = Sunday, 1 = Monday, etc.
  blocked_dates: string[]; // Array of "YYYY-MM-DD" strings
}

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("delivery_settings")
    .select("*")
    .single();
  return data || null;
}

export async function updateDeliverySettings(
  blockedDays: number[],
  blockedDates: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("delivery_settings")
    .upsert({
      id: 1,
      blocked_days: blockedDays,
      blocked_dates: blockedDates,
    }, { onConflict: "id" });

  if (error) {
    console.error("[v0] updateDeliverySettings error:", error.message, error.code, error.details);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
