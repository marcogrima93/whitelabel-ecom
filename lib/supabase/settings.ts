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
): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("delivery_settings")
    .update({
      blocked_days: blockedDays,
      blocked_dates: blockedDates,
    })
    .eq("id", 1);
  return !error;
}
