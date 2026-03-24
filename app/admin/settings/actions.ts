"use server";

import { updateDeliverySettings } from "@/lib/supabase/settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDeliverySettingsAction(
  blockedDays: number[],
  blockedDates: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const result = await updateDeliverySettings(blockedDays, blockedDates);
  if (!result.ok) {
    console.error("[v0] saveDeliverySettingsAction failed:", result.error);
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
